import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getProvider, runConversationLoop, toNeutralTools } from "@/lib/ai/client";
import { buildAdminSystemPrompt } from "@/lib/ai/admin-system-prompt";
import { adminTools } from "@/lib/ai/admin-tools";
import { processAdminToolCall } from "@/lib/ai/admin-extract";
import type { AIMessage } from "@/lib/ai/providers/types";

export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
          title: "Admin session",
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
    await db
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

    // ── Build system prompt ──────────────────────────────────────────
    const systemPrompt = buildAdminSystemPrompt();

    // ── Format messages ──────────────────────────────────────────────
    const aiMessages: AIMessage[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // ── Get provider and neutral tools ───────────────────────────────
    const provider = getProvider("admin-chat");
    const neutralTools = toNeutralTools(adminTools);

    // ── Stream response ──────────────────────────────────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: object) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        };

        try {
          const { text: finalText } = await runConversationLoop({
            provider,
            systemPrompt,
            messages: aiMessages,
            tools: neutralTools,
            maxRounds: 10,
            maxTokens: 4096,
            toolExecutor: async (name, input) => {
              const result = await processAdminToolCall(name, input);
              // Stream tool result info to client
              send({
                type: "extracted",
                entries: [
                  {
                    entryType: "admin",
                    name,
                    details: result,
                  },
                ],
              });
              return { result };
            },
            onText: (text) => {
              const chunkSize = 50;
              for (let i = 0; i < text.length; i += chunkSize) {
                send({ type: "text", content: text.slice(i, i + chunkSize) });
              }
            },
          });

          // ── Save assistant message ───────────────────────────────
          const [assistantMessage] = await db
            .insert(messages)
            .values({
              conversationId: conversationId!,
              role: "assistant",
              content: finalText,
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
          console.error("Admin AI API error:", error);
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
    console.error("Admin chat route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
