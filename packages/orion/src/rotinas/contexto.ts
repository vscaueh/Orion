import {
  agoraNoFuso,
  hoje,
  lerConfiguracoes,
  projetos,
  rotina as andarRotina,
  type ActionContext,
  type Agora,
  type Configuracoes,
} from "@orion/core";
import type { Canal } from "../channels";
import { encaixarTarefas, type TarefaParaEncaixar } from "../encaixe";
import type { LLMProvider } from "../types";

// Tudo que uma rotina precisa, montado uma vez.

export interface ContextoDaRotina {
  ctx: ActionContext;
  canal: Canal;
  provider: LLMProvider;
  agora: Agora;
  config: Configuracoes;
  resumo: hoje.ResumoHoje;
}

export async function montarContexto(
  ctx: ActionContext,
  canal: Canal,
  provider: LLMProvider,
): Promise<ContextoDaRotina> {
  const config = await lerConfiguracoes(ctx);
  return {
    ctx,
    canal,
    provider,
    config,
    agora: agoraNoFuso(config.fuso),
    resumo: await hoje.resumoDoDia(ctx),
  };
}

/** As tarefas em aberto, no formato que o encaixe entende. */
export async function tarefasParaEncaixar(
  ctx: ActionContext,
  hojeIso: string,
): Promise<TarefaParaEncaixar[]> {
  const tarefas = await projetos.listarTarefas(ctx);
  return projetos
    .tarefasComPrazo(hojeIso, tarefas, 7)
    .filter((t) => t.estimated_minutes !== null)
    .map((t) => ({
      id: t.id,
      titulo: t.title,
      duracaoMin: t.estimated_minutes!,
      prioridade: t.priority,
      prazo: t.due_on,
    }));
}

/** Encaixa as tarefas do dia nas janelas que ainda restam. */
export function planoDoDia({ ctx: _ctx, agora, config, resumo }: ContextoDaRotina, tarefas: TarefaParaEncaixar[]) {
  const janelas = andarRotina.janelasLivres(
    andarRotina.intervalosDoDia([], agora.diaSemana),
    { diaComeca: config.diaComeca, diaTermina: config.diaTermina },
  );
  // As janelas do resumo já vêm calculadas com os blocos reais.
  return encaixarTarefas(tarefas, resumo.janelas.length > 0 ? resumo.janelas : janelas, {
    agora: agora.minutos,
    maxFocoMin: config.maxFocoMin,
  });
}
