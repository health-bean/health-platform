/**
 * AI client entry point.
 *
 * Use `getProvider(task)` to get the right provider for a given task.
 * The router decides which provider (Gemini, Claude, etc.) handles it.
 */
export { getProvider } from "./router";
export { runConversationLoop } from "./conversation-loop";
export { toNeutralTools } from "./tools-adapter";
