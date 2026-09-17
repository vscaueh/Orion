import {
  faculdade,
  projetos,
  rotina,
  runAction,
  type Action,
  type ActionContext,
} from "@orion/core";
import { toolSpec } from "./schema-json";
import type { ToolSpec } from "./types";

// As tools da Orion são exatamente as actions do core — nunca uma
// reimplementação. Adicionar uma action a esta lista é tudo o que
// preciso para a Orion saber fazer algo novo.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QualquerAction = Action<any, any>;

export const ACTIONS: readonly QualquerAction[] = [
  faculdade.criarSemestre,
  faculdade.criarCadeira,
  faculdade.editarCadeira,
  faculdade.arquivarCadeira,
  faculdade.criarHorario,
  faculdade.arquivarHorario,
  faculdade.registrarFalta,
  faculdade.arquivarFalta,
  faculdade.salvarAvaliacao,
  rotina.criarHabito,
  rotina.editarHabito,
  rotina.marcarHabito,
  rotina.arquivarHabito,
  rotina.criarBloco,
  rotina.arquivarBloco,
  projetos.criarProjeto,
  projetos.editarProjeto,
  projetos.arquivarProjeto,
  projetos.criarTarefa,
  projetos.concluirTarefa,
  projetos.arquivarTarefa,
];

const POR_NOME_NA_FRONTEIRA = new Map(
  ACTIONS.map((a) => [a.name.replace(".", "__"), a]),
);

export function toolSpecs(): ToolSpec[] {
  return ACTIONS.map((a) => toolSpec(a));
}

export function acharAction(nomeNaFronteira: string): QualquerAction | null {
  return POR_NOME_NA_FRONTEIRA.get(nomeNaFronteira) ?? null;
}

export interface ResultadoDaTool {
  /** Texto que volta ao modelo descrevendo o que aconteceu. */
  texto: string;
  /** Preenchido quando virou proposta em vez de execução. */
  proposta?: { action: string; payload: unknown; resumo: string };
}

/**
 * Executa uma tool pedida pelo modelo. Uma action que exige aprovação
 * não roda aqui: vira proposta, e quem persiste isso é o chamador —
 * assim esta função continua sem saber de banco.
 */
export async function executarTool(
  ctx: ActionContext,
  nome: string,
  argumentos: unknown,
): Promise<ResultadoDaTool> {
  const action = acharAction(nome);
  if (!action) {
    return { texto: `Ferramenta desconhecida: ${nome}.` };
  }

  // Validar antes de propor: não faz sentido pedir aprovação para uma
  // ação que já se sabe malformada.
  const validacao = action.input.safeParse(argumentos);
  if (!validacao.success) {
    const problemas = validacao.error.issues
      .map((i) => `${i.path.join(".") || "entrada"}: ${i.message}`)
      .join("; ");
    return { texto: `Entrada inválida para ${action.name} — ${problemas}` };
  }

  if (action.requiresApproval) {
    return {
      texto:
        `A ação ${action.name} foi registrada como proposta e está ` +
        `aguardando aprovação. Ela ainda não foi executada.`,
      proposta: {
        action: action.name,
        payload: validacao.data,
        resumo: action.description,
      },
    };
  }

  try {
    const resultado = await runAction(action, ctx, validacao.data);
    return { texto: `Feito. ${JSON.stringify(resultado ?? "ok").slice(0, 500)}` };
  } catch (erro) {
    return {
      texto: `A ação ${action.name} falhou: ${
        erro instanceof Error ? erro.message : String(erro)
      }`,
    };
  }
}
