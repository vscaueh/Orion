import type { ActionContext } from "@orion/core";

// Fatos duráveis sobre o usuário — preferências, padrões, decisões.
// Não é transcrição de conversa: isso são as mensagens.

export interface Fato {
  id: string;
  fact: string;
  category: string | null;
  origin: "usuario" | "inferido";
  confidence: number;
}

export async function lembrar(
  { supabase, userId }: ActionContext,
  fato: string,
  categoria?: string,
  origem: "usuario" | "inferido" = "usuario",
): Promise<Fato> {
  const { data, error } = await supabase
    .from("orion_memory")
    .insert({
      user_id: userId,
      fact: fato,
      category: categoria ?? null,
      origin: origem,
      // Um fato inferido vale menos que um dito por ele.
      confidence: origem === "usuario" ? 1 : 0.6,
      confirmed_at: origem === "usuario" ? new Date().toISOString() : null,
    })
    .select()
    .single<Fato>();
  if (error) throw new Error(`Erro ao guardar fato: ${error.message}`);
  return data;
}

export async function esquecer(
  { supabase, userId }: ActionContext,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("orion_memory")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(`Erro ao esquecer fato: ${error.message}`);
}

/**
 * Os fatos a colocar no contexto. Sem busca ainda: com poucas dezenas
 * de fatos, mandar os mais recentes é melhor do que arriscar deixar
 * de fora o que importava. Busca textual entra quando incomodar.
 */
export async function lembretes(
  { supabase, userId }: ActionContext,
  limite = 40,
): Promise<Fato[]> {
  const { data, error } = await supabase
    .from("orion_memory")
    .select("id, fact, category, origin, confidence")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limite)
    .returns<Fato[]>();
  if (error) throw new Error(`Erro ao ler memória: ${error.message}`);
  return data;
}
