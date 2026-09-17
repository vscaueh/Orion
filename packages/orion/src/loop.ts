import type { ActionContext } from "@orion/core";
import { executarTool, toolSpecs, type ResultadoDaTool } from "./tools";
import type { LLMProvider, Message } from "./types";

/** Teto de idas ao modelo por turno, contra loops de ferramenta. */
export const MAX_ITERACOES = 8;

export interface TurnoResultado {
  /** O que a Orion respondeu no fim. */
  resposta: string;
  /** Mensagens novas do turno, para persistir na conversa. */
  novasMensagens: Message[];
  /** Propostas criadas, para o chamador gravar e mostrar. */
  propostas: NonNullable<ResultadoDaTool["proposta"]>[];
  /** Quantas vezes o modelo foi chamado. */
  iteracoes: number;
}

/**
 * Um turno de conversa: o modelo responde, pede ferramentas, recebe os
 * resultados e responde de novo, até chegar a uma resposta final ou
 * bater o teto de iterações.
 */
export async function rodarTurno({
  provider,
  ctx,
  system,
  historico,
}: {
  provider: LLMProvider;
  ctx: ActionContext;
  system: string;
  historico: Message[];
}): Promise<TurnoResultado> {
  const tools = toolSpecs();
  const novasMensagens: Message[] = [];
  const propostas: NonNullable<ResultadoDaTool["proposta"]>[] = [];

  for (let iteracao = 1; iteracao <= MAX_ITERACOES; iteracao++) {
    const resultado = await provider.complete({
      system,
      messages: [...historico, ...novasMensagens],
      tools,
    });

    const mensagemDoModelo: Message = {
      role: "assistant",
      content: resultado.text ?? "",
      ...(resultado.toolCalls.length > 0
        ? { toolCalls: resultado.toolCalls }
        : {}),
    };
    novasMensagens.push(mensagemDoModelo);

    if (resultado.toolCalls.length === 0) {
      return {
        resposta: resultado.text ?? "",
        novasMensagens,
        propostas,
        iteracoes: iteracao,
      };
    }

    for (const chamada of resultado.toolCalls) {
      const saida = await executarTool(ctx, chamada.name, chamada.arguments);
      if (saida.proposta) propostas.push(saida.proposta);
      novasMensagens.push({
        role: "tool",
        content: saida.texto,
        toolCallId: chamada.id,
        toolName: chamada.name,
      });
    }
  }

  // Estourou o teto: melhor dizer isso do que devolver silêncio.
  const aviso =
    "Me enrolei tentando resolver isso com as ferramentas. Pode reformular?";
  novasMensagens.push({ role: "assistant", content: aviso });
  return {
    resposta: aviso,
    novasMensagens,
    propostas,
    iteracoes: MAX_ITERACOES,
  };
}
