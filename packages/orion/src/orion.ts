import { agoraNoFuso, hoje, type ActionContext } from "@orion/core";
import { conversaAtual, historico, salvarMensagens, type NomeDoCanal } from "./conversas";
import { rodarTurno } from "./loop";
import { lembretes } from "./memoria";
import { montarSystemPrompt } from "./prompt";
import { criarPropostas } from "./propostas";
import { resumoEmTexto } from "./resumo-texto";
import type { LLMProvider } from "./types";

export interface RespostaDaOrion {
  resposta: string;
  conversaId: string;
  propostasCriadas: number;
}

/**
 * Um turno completo: monta o contexto, roda o loop de ferramentas,
 * grava as mensagens e as propostas. É o que web e worker chamam —
 * nenhum dos dois reimplementa nada disso.
 */
export async function responder({
  ctx,
  provider,
  texto,
  canal = "web",
}: {
  ctx: ActionContext;
  provider: LLMProvider;
  texto: string;
  canal?: NomeDoCanal;
}): Promise<RespostaDaOrion> {
  const agora = agoraNoFuso();

  const [conversaId, fatos, resumoDoDia] = await Promise.all([
    conversaAtual(ctx, canal),
    lembretes(ctx),
    hoje.resumoDoDia(ctx),
  ]);

  const anteriores = await historico(ctx, conversaId);
  const mensagemDoUsuario = { role: "user" as const, content: texto };

  const turno = await rodarTurno({
    provider,
    ctx,
    system: montarSystemPrompt({
      agora,
      resumoDoDia: resumoEmTexto(resumoDoDia),
      memoria: fatos.map((f) => f.fact),
    }),
    historico: [...anteriores, mensagemDoUsuario],
  });

  await salvarMensagens(ctx, conversaId, [
    mensagemDoUsuario,
    ...turno.novasMensagens,
  ]);
  await criarPropostas(ctx, turno.propostas, conversaId);

  return {
    resposta: turno.resposta,
    conversaId,
    propostasCriadas: turno.propostas.length,
  };
}
