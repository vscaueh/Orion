import { GeminiProvider, type LLMProvider } from "@orion/orion";
import { requireEnv } from "@/lib/env";

// A chave do modelo nunca chega ao cliente: este módulo só é importado
// por Server Actions e Server Components.
export function provider(): LLMProvider {
  return new GeminiProvider({
    apiKey: requireEnv("GEMINI_API_KEY"),
    model: process.env.GEMINI_MODEL,
  });
}
