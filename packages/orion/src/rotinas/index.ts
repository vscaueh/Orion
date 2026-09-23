import { faculdade, rotina as andarRotina, type ActionContext } from "@orion/core";
import { botoesDaProposta, type Canal } from "../channels";
import { descreverEncaixe } from "../encaixe";
import { umaVezPorJanela } from "../jobs";
import { pendentes } from "../propostas";
import type { LLMProvider } from "../types";
import {
  montarContexto,
  planoDoDia,
  tarefasParaEncaixar,
  type ContextoDaRotina,
} from "./contexto";

// As rotinas montam a mensagem com dados, não com o modelo. "Tem prova
// amanhã?" é uma consulta, e consulta não erra nem custa tokens. O
// modelo só entraria para reescrever o texto — e para um aviso curto
// isso não paga o risco de ele inventar um dado.
//
// Toda rotina devolve a mensagem, ou null quando não há o que dizer:
// um sistema que fala sem ter assunto vira ruído e passa a ser ignorado.

export interface OpcoesDaRotina {
  ctx: ActionContext;
  canal: Canal;
  provider: LLMProvider;
}

export async function montarODia(opcoes: OpcoesDaRotina): Promise<string | null> {
  const contexto = await montarContexto(opcoes.ctx, opcoes.canal, opcoes.provider);
  const { agora } = contexto;

  return umaVezPorJanela(
    opcoes.ctx,
    "montar_o_dia",
    agora.dataIso,
    async () => {
      const texto = await textoDoDia(contexto);
      await opcoes.canal.send(opcoes.ctx.userId, texto);
      return texto;
    },
  ).then((r) => r.resultado ?? null);
}

async function textoDoDia(contexto: ContextoDaRotina): Promise<string> {
  const { resumo, agora, ctx } = contexto;
  const linhas: string[] = [
    `Bom dia, Motta. ${faculdade.DIAS_SEMANA[agora.diaSemana]}, ${formatarData(agora.dataIso)}.`,
  ];

  if (resumo.proximaAula) {
    const { cadeira, aula, diasAFrente } = resumo.proximaAula;
    if (diasAFrente === 0) {
      linhas.push(
        `\nAula: ${cadeira.name} às ${faculdade.formatarHora(aula.starts_at)}` +
          `${aula.location ? ` (${aula.location})` : ""}.`,
      );
    }
  }

  if (resumo.provas.length > 0) {
    linhas.push(
      "\nProvas chegando:",
      ...resumo.provas.map(
        (p) => `• ${p.cadeira.name} ${p.avaliacao.type ?? ""} em ${formatarData(p.avaliacao.date!)}`,
      ),
    );
  }

  if (resumo.habitos.length > 0) {
    linhas.push(
      "\nHábitos de hoje: " + resumo.habitos.map((h) => h.habito.name).join(", ") + ".",
    );
  }

  const tarefas = await tarefasParaEncaixar(ctx, agora.dataIso);
  const { encaixes, naoCoube } = planoDoDia(contexto, tarefas);

  if (encaixes.length > 0) {
    linhas.push(
      `\nDá para encaixar (${andarRotina.descreverDuracao(resumo.minutosLivres)} livres):`,
      ...encaixes.map((e) => `• ${descreverEncaixe(e)}`),
    );
  }
  if (naoCoube.length > 0) {
    linhas.push(`\nNão coube hoje: ${naoCoube.map((t) => t.titulo).join(", ")}.`);
  }

  if (linhas.length === 1) {
    linhas.push("\nNada marcado. Dia seu.");
  }

  return linhas.join("\n");
}

/**
 * Avisa o que falta e onde encaixar. Silencia quando não há pendência —
 * é a rotina que roda mais vezes, e a que mais rápido vira ruído.
 */
export async function pendencias(opcoes: OpcoesDaRotina): Promise<string | null> {
  const contexto = await montarContexto(opcoes.ctx, opcoes.canal, opcoes.provider);
  const { agora, resumo } = contexto;
  const slot = `${agora.dataIso}T${String(Math.floor(agora.minutos / 60)).padStart(2, "0")}`;

  const resultado = await umaVezPorJanela(
    opcoes.ctx,
    "pendencias",
    slot,
    async () => {
      const habitosAbertos = resumo.habitos.filter((h) => !h.feito);
      const tarefasHoje = resumo.tarefas.filter(
        (t) => t.tarefa.due_on !== null && t.tarefa.due_on <= agora.dataIso,
      );
      const propostas = await pendentes(opcoes.ctx);

      if (
        habitosAbertos.length === 0 &&
        tarefasHoje.length === 0 &&
        propostas.length === 0
      ) {
        return null; // nada a dizer
      }

      const linhas: string[] = [];
      if (tarefasHoje.length > 0) {
        linhas.push(
          "Vencendo hoje: " + tarefasHoje.map((t) => t.tarefa.title).join(", ") + ".",
        );
      }
      if (habitosAbertos.length > 0) {
        linhas.push("Falta marcar: " + habitosAbertos.map((h) => h.habito.name).join(", ") + ".");
      }
      if (propostas.length > 0) {
        linhas.push(
          `${propostas.length} ${propostas.length === 1 ? "proposta esperando" : "propostas esperando"} aprovação.`,
        );
      }

      const proxima = resumo.janelas.find((j) => j.fim > agora.minutos);
      if (proxima) {
        linhas.push(
          `Próxima janela: ${andarRotina.formatarMinutos(Math.max(proxima.inicio, agora.minutos))}–${andarRotina.formatarMinutos(proxima.fim)}.`,
        );
      }

      const texto = linhas.join("\n");
      await opcoes.canal.send(opcoes.ctx.userId, texto);
      return texto;
    },
  );

  return resultado.resultado ?? null;
}

/** Fecha o dia: o que ficou, e a pergunta que alimenta a memória. */
export async function fechamento(opcoes: OpcoesDaRotina): Promise<string | null> {
  const contexto = await montarContexto(opcoes.ctx, opcoes.canal, opcoes.provider);
  const { agora, resumo } = contexto;

  const resultado = await umaVezPorJanela(
    opcoes.ctx,
    "fechamento",
    agora.dataIso,
    async () => {
      const habitosAbertos = resumo.habitos.filter((h) => !h.feito);
      const feitos = resumo.habitos.filter((h) => h.feito);

      const linhas = ["Fechando o dia."];
      if (feitos.length > 0) {
        linhas.push(`Feito: ${feitos.map((h) => h.habito.name).join(", ")}.`);
      }
      if (habitosAbertos.length > 0) {
        linhas.push(`Ficou para trás: ${habitosAbertos.map((h) => h.habito.name).join(", ")}.`);
      }
      if (resumo.tarefas.length > 0) {
        linhas.push(
          `Tarefas em aberto: ${resumo.tarefas.map((t) => t.tarefa.title).join(", ")}.`,
        );
      }
      linhas.push("\nComo foi o dia?");

      const texto = linhas.join("\n");
      await opcoes.canal.send(opcoes.ctx.userId, texto);
      return texto;
    },
  );

  return resultado.resultado ?? null;
}

/** Domingo: a semana que vem, com provas e prazos. */
export async function semana(opcoes: OpcoesDaRotina): Promise<string | null> {
  const contexto = await montarContexto(opcoes.ctx, opcoes.canal, opcoes.provider);
  const { agora, resumo, ctx } = contexto;

  const resultado = await umaVezPorJanela(
    opcoes.ctx,
    "semana",
    agora.dataIso,
    async () => {
      const tarefas = await tarefasParaEncaixar(ctx, agora.dataIso);
      const linhas = ["Semana que vem:"];

      if (resumo.provas.length > 0) {
        linhas.push(
          "\nProvas:",
          ...resumo.provas.map(
            (p) => `• ${p.cadeira.name} ${p.avaliacao.type ?? ""} em ${formatarData(p.avaliacao.date!)}`,
          ),
        );
      }
      if (tarefas.length > 0) {
        linhas.push(
          "\nPrazos:",
          ...tarefas.map(
            (t) => `• ${t.titulo}${t.prazo ? ` até ${formatarData(t.prazo)}` : ""}`,
          ),
        );
      }
      if (linhas.length === 1) return null;

      const texto = linhas.join("\n");
      await opcoes.canal.send(opcoes.ctx.userId, texto);
      return texto;
    },
  );

  return resultado.resultado ?? null;
}

/** Avisa sobre propostas que estão perto de expirar. */
export async function lembrarPropostas(opcoes: OpcoesDaRotina): Promise<void> {
  const lista = await pendentes(opcoes.ctx);
  for (const proposta of lista) {
    await opcoes.canal.send(
      opcoes.ctx.userId,
      `Pendente: ${proposta.summary}`,
      { botoes: botoesDaProposta(proposta.id) },
    );
  }
}

function formatarData(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}
