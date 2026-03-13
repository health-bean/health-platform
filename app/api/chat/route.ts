import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  users,
  protocols,
  protocolRules,
} from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getProvider, runConversationLoop, toNeutralTools } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";
import { processToolCall } from "@/lib/ai/extract";
import { buildCoachingContext } from "@/lib/coaching/context";
import type { AIMessage } from "@/lib/ai/providers/types";

export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse body ───────────────────────────────────────────────────
    const body = await request.json();
    const { message, conversationId: incomingConversationId } = body as {
      message: string;
      conversationId?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // ── Conversation: find or create ─────────────────────────────────
    let conversationId = incomingConversationId;

    if (!conversationId) {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId: session.userId,
          title: message.slice(0, 100),
        })
        .returning({ id: conversations.id });

      conversationId = newConversation.id;
    } else {
      // Verify the conversation belongs to this user
      const [conv] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conv) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    // ── Save user message ────────────────────────────────────────────
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        role: "user",
        content: message,
      })
      .returning({ id: messages.id });

    // ── Load conversation history ────────────────────────────────────
    const history = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    // ── Build system prompt with user's protocol ─────────────────────
    const [user] = await db
      .select({
        currentProtocolId: users.currentProtocolId,
        firstName: users.firstName,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    let protocolName: string | undefined;
    let protocolRulesText: string | undefined;

    if (user?.currentProtocolId) {
      const [protocol] = await db
        .select({
          name: protocols.name,
          description: protocols.description,
        })
        .from(protocols)
        .where(eq(protocols.id, user.currentProtocolId))
        .limit(1);

      if (protocol) {
        protocolName = protocol.name;

        const rules = await db
          .select({
            ruleType: protocolRules.ruleType,
            propertyName: protocolRules.propertyName,
            propertyValues: protocolRules.propertyValues,
            status: protocolRules.status,
            notes: protocolRules.notes,
          })
          .from(protocolRules)
          .where(eq(protocolRules.protocolId, user.currentProtocolId))
          .orderBy(asc(protocolRules.ruleOrder));

        if (rules.length > 0) {
          protocolRulesText = rules
            .map((r) => {
              let line = `- ${r.status.toUpperCase()}: ${r.ruleType}`;
              if (r.propertyName) line += ` (${r.propertyName})`;
              if (r.propertyValues && r.propertyValues.length > 0) {
                line += `: ${r.propertyValues.join(", ")}`;
              }
              if (r.notes) line += ` -- ${r.notes}`;
              return line;
            })
            .join("\n");
        }

        if (protocol.description) {
          protocolRulesText =
            `${protocol.description}\n\n${protocolRulesText || ""}`;
        }
      }
    }

    // Build coaching context from user data
    let coachingContext: string | undefined;
    try {
      const ctx = await buildCoachingContext(session.userId);
      if (ctx) coachingContext = ctx;
    } catch (err) {
      console.error("Failed to build coaching context:", err);
    }

    const systemPrompt = buildSystemPrompt(protocolName, protocolRulesText, coachingContext);

    // ── Format messages ──────────────────────────────────────────────
    const aiMessages: AIMessage[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // ── Get provider and neutral tools ───────────────────────────────
    const provider = getProvider("daily-chat");
    const neutralTools = toNeutralTools(tools);

    // ── Stream response ──────────────────────────────────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: object) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        };

        try {
          const { text: finalText, extractedEntries } = await runConversationLoop({
            provider,
            systemPrompt,
            messages: aiMessages,
            tools: neutralTools,
            maxRounds: 5,
            maxTokens: 1024,
            toolExecutor: async (name, input) => {
              return processToolCall(name, input, session.userId, userMessage.id);
            },
            onText: (text) => {
              const chunkSize = 50;
              for (let i = 0; i < text.length; i += chunkSize) {
                send({ type: "text", content: text.slice(i, i + chunkSize) });
              }
            },
            onExtracted: (entries) => {
              send({ type: "extracted", entries });
            },
          });

          // ── Save assistant message ───────────────────────────────
          const [assistantMessage] = await db
            .insert(messages)
            .values({
              conversationId: conversationId!,
              role: "assistant",
              content: finalText,
              extractedData:
                extractedEntries.length > 0 ? extractedEntries : null,
            })
            .returning({ id: messages.id });

          // Update conversation timestamp
          await db
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, conversationId!));

          send({
            type: "done",
            messageId: assistantMessage.id,
            conversationId,
          });

          controller.close();
        } catch (error) {
          console.error("AI API error:", error);
          send({
            type: "error",
            message: "Something went wrong generating a response.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
