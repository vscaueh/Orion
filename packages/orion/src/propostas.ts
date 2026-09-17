import { runAction, type Action, type ActionContext } from "@orion/core";
import { ACTIONS } from "./tools";

// "A Orion propõe, o usuário aprova." Uma proposta é uma action
// validada e guardada, esperando o sim.

export interface Proposta {
  id: string;
  action: string;
  summary: string;
  payload: unknown;
  status: "pendente" | "aprovada" | "rejeitada" | "expirada";
  result: string | null;
  expires_at: string;
  created_at: string;
}

// A chave é o nome vindo do banco, que é string solta — o tipo da
// action é mais estreito que isso.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const POR_NOME = new Map<string, Action<any, any>>(
  ACTIONS.map((a) => [a.name as string, a]),
);

export async function criarPropostas(
  { supabase, userId }: ActionContext,
  propostas: readonly { action: string; payload: unknown; resumo: string }[],
  conversaId?: string,
): Promise<void> {
  if (propostas.length === 0) return;
  const { error } = await supabase.from("orion_proposals").insert(
    propostas.map((p) => ({
      user_id: userId,
      action: p.action,
      summary: p.resumo,
      payload: p.payload,
      conversation_id: conversaId ?? null,
    })),
  );
  if (error) throw new Error(`Erro ao criar proposta: ${error.message}`);
}

/** Pendentes que ainda não expiraram. Propostas valem 24h. */
export async function pendentes(
  { supabase, userId }: ActionContext,
): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from("orion_proposals")
    .select("id, action, summary, payload, status, result, expires_at, created_at")
    .eq("user_id", userId)
    .eq("status", "pendente")
    .gt("expires_at", new Date().toISOString())
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .returns<Proposta[]>();
  if (error) throw new Error(`Erro ao listar propostas: ${error.message}`);
  return data;
}

/**
 * Aprovar executa a action guardada. Se a execução falhar, a proposta
 * continua pendente com o erro registrado — assim dá para corrigir e
 * tentar de novo em vez de perder o pedido.
 */
export async function aprovar(
  ctx: ActionContext,
  id: string,
): Promise<{ ok: boolean; erro?: string }> {
  const { data: proposta, error } = await ctx.supabase
    .from("orion_proposals")
    .select("action, payload, status")
    .eq("id", id)
    .eq("user_id", ctx.userId)
    .single<{ action: string; payload: unknown; status: string }>();
  if (error) throw new Error(`Proposta não encontrada: ${error.message}`);
  if (proposta.status !== "pendente") {
    return { ok: false, erro: "Esta proposta já foi resolvida." };
  }

  const action = POR_NOME.get(proposta.action);
  if (!action) {
    return { ok: false, erro: `Ação desconhecida: ${proposta.action}` };
  }

  try {
    await runAction(action, ctx, proposta.payload);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    await ctx.supabase
      .from("orion_proposals")
      .update({ result: mensagem })
      .eq("id", id)
      .eq("user_id", ctx.userId);
    return { ok: false, erro: mensagem };
  }

  await ctx.supabase
    .from("orion_proposals")
    .update({
      status: "aprovada",
      resolved_at: new Date().toISOString(),
      result: null,
    })
    .eq("id", id)
    .eq("user_id", ctx.userId);
  return { ok: true };
}

export async function rejeitar(
  { supabase, userId }: ActionContext,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("orion_proposals")
    .update({ status: "rejeitada", resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "pendente");
  if (error) throw new Error(`Erro ao rejeitar proposta: ${error.message}`);
}
