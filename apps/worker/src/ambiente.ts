import { createClient } from "@supabase/supabase-js";
import { GeminiProvider, type LLMProvider } from "@orion/orion";
import type { ActionContext } from "@orion/core";

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida.`);
  return valor;
}

/**
 * O worker não tem sessão de usuário: ninguém fez login nele. Ele usa a
 * chave secreta do Supabase e age em nome do dono, cujo id vem da
 * configuração.
 *
 * Isso contorna a RLS, então o cuidado passa a ser do código: toda
 * action e query já recebem o userId pelo ActionContext e filtram por
 * ele. A chave secreta nunca sai daqui — não existe no apps/web.
 */
export function contextoDoDono(): ActionContext {
  const supabase = createClient(
    obrigatoria("SUPABASE_URL"),
    obrigatoria("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return { supabase, userId: obrigatoria("OWNER_USER_ID") };
}

export function provider(): LLMProvider {
  return new GeminiProvider({
    apiKey: obrigatoria("GEMINI_API_KEY"),
    model: process.env.GEMINI_MODEL,
  });
}
