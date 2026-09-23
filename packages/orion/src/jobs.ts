import type { ActionContext } from "@orion/core";

// Idempotência das rotinas: a mesma rotina, na mesma janela, roda uma
// vez só. Um worker que reinicia às 7h05 não pode mandar o plano do dia
// de novo — e a única forma de saber é ter registrado que já mandou.

export type StatusDoJob = "ok" | "erro" | "silenciada";

/** Já rodou nesta janela? */
export async function jaRodou(
  { supabase, userId }: ActionContext,
  rotina: string,
  slot: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("orion_jobs")
    .select("id")
    .eq("user_id", userId)
    .eq("routine", rotina)
    .eq("slot", slot)
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`Erro ao consultar execuções: ${error.message}`);
  return data !== null;
}

export async function registrar(
  { supabase, userId }: ActionContext,
  rotina: string,
  slot: string,
  status: StatusDoJob,
  resultado?: string,
): Promise<void> {
  const { error } = await supabase.from("orion_jobs").upsert(
    {
      user_id: userId,
      routine: rotina,
      slot,
      status,
      result: resultado ?? null,
      ran_at: new Date().toISOString(),
    },
    { onConflict: "user_id,routine,slot" },
  );
  if (error) throw new Error(`Erro ao registrar execução: ${error.message}`);
}

/**
 * Roda a rotina uma vez por janela. A marca é gravada **antes** do
 * trabalho: se algo explodir no meio, a rotina não se repete sozinha
 * na próxima batida do relógio — repetir um aviso é pior do que
 * perdê-lo, porque ensina o usuário a ignorar as mensagens.
 */
export async function umaVezPorJanela(
  ctx: ActionContext,
  rotina: string,
  slot: string,
  trabalho: () => Promise<string | null>,
): Promise<{ rodou: boolean; resultado?: string }> {
  if (await jaRodou(ctx, rotina, slot)) return { rodou: false };

  await registrar(ctx, rotina, slot, "ok");
  try {
    const resultado = await trabalho();
    await registrar(
      ctx,
      rotina,
      slot,
      resultado === null ? "silenciada" : "ok",
      resultado ?? undefined,
    );
    return { rodou: resultado !== null, resultado: resultado ?? undefined };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    await registrar(ctx, rotina, slot, "erro", mensagem);
    throw erro;
  }
}
