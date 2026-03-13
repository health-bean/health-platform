import type { AITool } from "./providers/types";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Convert Anthropic-format tool definitions to provider-neutral AITool[].
 * This lets us keep the existing tools.ts and admin-tools.ts unchanged.
 */
export function toNeutralTools(
  anthropicTools: Anthropic.Tool[]
): AITool[] {
  return anthropicTools.map((t) => ({
    name: t.name,
    description: t.description ?? "",
    parameters: t.input_schema as Record<string, unknown>,
  }));
}
