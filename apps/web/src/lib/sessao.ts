import { cache } from "react";
import type { ActionContext } from "@orion/core";
import { createClient } from "@/lib/supabase/server";

/**
 * A sessão do usuário, uma vez por requisição.
 *
 * getUser() é uma ida à rede: ele valida o token no servidor do
 * Supabase. Layout e página chamavam cada um o seu, dobrando a espera
 * em toda navegação. O cache() do React memoriza dentro da mesma
 * renderização, então a segunda chamada é de graça.
 */
export const sessao = cache(
  async (): Promise<(ActionContext & { email: string | null }) | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { supabase, userId: user.id, email: user.email ?? null };
  },
);
