import { GoogleGenAI, type Content, type Part, type FunctionDeclaration } from "@google/genai";
import type {
  AIProvider,
  AIMessage,
  AITool,
  AIToolCall,
  AIResponse,
  AIContentPart,
} from "./types";

// ── Format conversions ──────────────────────────────────────────────────

function toGeminiContents(msgs: AIMessage[]): Content[] {
  const contents: Content[] = [];

  for (const msg of msgs) {
    if (typeof msg.content === "string") {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
      continue;
    }

    const parts = contentPartsToGemini(msg.content);

    // Gemini uses "function" role for tool results
    if (msg.content.some((p) => p.type === "tool_result")) {
      contents.push({ role: "function" as string, parts });
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }
  }

  return contents;
}

function contentPartsToGemini(parts: AIContentPart[]): Part[] {
  return parts.map((part): Part => {
    switch (part.type) {
      case "text":
        return { text: part.text };
      case "image":
        return {
          inlineData: {
            mimeType: part.mimeType,
            data: part.imageData.replace(/^data:[^;]+;base64,/, ""),
          },
        };
      case "tool_use":
        return {
          functionCall: {
            name: part.name,
            args: part.input as Record<string, unknown>,
          },
        };
      case "tool_result": {
        let responseData: Record<string, unknown>;
        try {
          responseData = JSON.parse(part.content);
        } catch {
          responseData = { result: part.content };
        }
        return {
          functionResponse: {
            name: part.toolCallId,
            response: responseData,
          },
        };
      }
    }
  });
}

/**
 * Convert neutral AITool[] to Gemini FunctionDeclaration[].
 * Uses `parametersJsonSchema` which accepts raw JSON Schema directly —
 * no type conversion needed.
 */
function toGeminiFunctionDeclarations(tools: AITool[]): FunctionDeclaration[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.parameters,
  }));
}

let _toolCallCounter = 0;
function nextToolCallId(name: string): string {
  return `gemini_${name}_${++_toolCallCounter}`;
}

// ── Provider ────────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly displayName = "Google Gemini";

  private client: GoogleGenAI;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel?: string) {
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY is required for GeminiProvider");
    }
    this.client = new GoogleGenAI({ apiKey });
    this.defaultModel = defaultModel ?? "gemini-2.0-flash";
  }

  async chat(params: {
    model?: string;
    systemPrompt: string;
    messages: AIMessage[];
    tools?: AITool[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<AIResponse> {
    const modelName = params.model ?? this.defaultModel;

    const response = await this.client.models.generateContent({
      model: modelName,
      contents: toGeminiContents(params.messages),
      config: {
        systemInstruction: params.systemPrompt,
        maxOutputTokens: params.maxTokens ?? 1024,
        ...(params.temperature !== undefined
          ? { temperature: params.temperature }
          : {}),
        ...(params.tools && params.tools.length > 0
          ? {
              tools: [
                { functionDeclarations: toGeminiFunctionDeclarations(params.tools) },
              ],
            }
          : {}),
      },
    });

    // Parse response
    let text = "";
    const toolCalls: AIToolCall[] = [];

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      for (const part of candidate.content?.parts ?? []) {
        if (part.text) {
          text += part.text;
        }
        if (part.functionCall) {
          const fnName = part.functionCall.name ?? "";
          toolCalls.push({
            id: part.functionCall.id ?? nextToolCallId(fnName),
            name: fnName,
            input: part.functionCall.args ?? {},
          });
        }
      }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    const stopReason =
      toolCalls.length > 0
        ? "tool_use" as const
        : finishReason === "MAX_TOKENS"
          ? "max_tokens" as const
          : "end_turn" as const;

    return {
      text,
      toolCalls,
      stopReason,
      usage: response.usageMetadata
        ? {
            inputTokens: response.usageMetadata.promptTokenCount ?? 0,
            outputTokens: response.usageMetadata.candidatesTokenCount ?? 0,
          }
        : undefined,
    };
  }

  resolveToolResultId(toolCall: AIToolCall): string {
    // Gemini expects the function name as the tool result identifier
    return toolCall.name;
  }
}
