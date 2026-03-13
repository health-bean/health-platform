import type { AIProvider } from "./types";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";

/**
 * Singleton registry of AI provider instances.
 * Providers are lazily instantiated on first access.
 */

const providers = new Map<string, AIProvider>();

function getOrCreateProvider(id: string): AIProvider {
  const existing = providers.get(id);
  if (existing) return existing;

  let provider: AIProvider;

  switch (id) {
    case "anthropic":
      provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
      break;
    case "gemini":
      provider = new GeminiProvider(process.env.GOOGLE_AI_API_KEY);
      break;
    default:
      throw new Error(`Unknown AI provider: ${id}`);
  }

  providers.set(id, provider);
  return provider;
}

export function getProviderById(id: string): AIProvider {
  return getOrCreateProvider(id);
}

/** Check whether a provider's API key is configured. */
export function isProviderAvailable(id: string): boolean {
  switch (id) {
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "gemini":
      return !!process.env.GOOGLE_AI_API_KEY;
    default:
      return false;
  }
}
