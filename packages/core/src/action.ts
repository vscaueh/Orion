import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

export interface ActionContext {
  supabase: SupabaseClient;
  userId: string;
}

// Contrato de toda ação do sistema. As telas chamam runAction() direto;
// na Fase 3 a Orion lê name/description/input para expor a MESMA ação
// como tool — por isso a descrição em português e o schema zod moram
// aqui, e não na interface.
export interface Action<TInput, TResult> {
  /** Identificador "andar.acao", ex.: "faculdade.criar_semestre". */
  name: `${string}.${string}`;
  /** Descrição em português — vira a descrição da tool da Orion. */
  description: string;
  input: z.ZodType<TInput>;
  /** true = altera dados (para a Orion, mutation exige aprovação). */
  mutation: boolean;
  /** Se a Orion precisa de aprovação; o site executa direto. */
  requiresApproval: boolean;
  execute(ctx: ActionContext, input: TInput): Promise<TResult>;
}

// Identidade com inferência de tipos — existir uma função (em vez de
// declarar o objeto solto) garante que toda action siga o contrato.
export function defineAction<TInput, TResult>(
  action: Action<TInput, TResult>,
): Action<TInput, TResult> {
  return action;
}

/**
 * Ponto único de execução: valida a entrada com zod e executa.
 * Entrada inválida lança ZodError antes de tocar no banco.
 */
export async function runAction<TInput, TResult>(
  action: Action<TInput, TResult>,
  ctx: ActionContext,
  rawInput: unknown,
): Promise<TResult> {
  const input = action.input.parse(rawInput);
  return action.execute(ctx, input);
}
