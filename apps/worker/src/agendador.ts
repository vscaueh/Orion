import cron from "node-cron";
import { lerConfiguracoes, type ActionContext } from "@orion/core";
import { rotinas, TelegramCanal, type Canal, type LLMProvider } from "@orion/orion";

// Agendador em memória. Quem garante que nada roda duas vezes não é o
// cron — é a tabela orion_jobs: o worker pode reiniciar, o cron pode
// disparar atrasado, e a rotina continua acontecendo uma vez por janela.

export interface Agendamento {
  nome: string;
  /** Expressão cron, no fuso do usuário. */
  quando: string;
  executar: (opcoes: rotinas.OpcoesDaRotina) => Promise<unknown>;
}

export const AGENDA: readonly Agendamento[] = [
  { nome: "montar o dia", quando: "0 7 * * *", executar: rotinas.montarODia },
  // De duas em duas horas, das 9h às 21h. Silencia quando não há nada.
  { nome: "pendências", quando: "0 9-21/2 * * *", executar: rotinas.pendencias },
  { nome: "fechamento", quando: "0 22 * * *", executar: rotinas.fechamento },
  { nome: "semana", quando: "0 19 * * 0", executar: rotinas.semana },
];

export async function iniciarAgendador({
  ctx,
  provider,
  canal,
}: {
  ctx: ActionContext;
  provider: LLMProvider;
  canal: Canal;
}): Promise<void> {
  const { fuso } = await lerConfiguracoes(ctx);

  for (const agendamento of AGENDA) {
    cron.schedule(
      agendamento.quando,
      async () => {
        try {
          const resultado = await agendamento.executar({ ctx, canal, provider });
          console.log(
            `[${agendamento.nome}] ${resultado === null ? "silenciada" : "enviada"}`,
          );
        } catch (erro) {
          // Uma rotina que falha não pode derrubar as outras.
          console.error(`[${agendamento.nome}] falhou:`, erro);
        }
      },
      { timezone: fuso },
    );
    console.log(`Agendado: ${agendamento.nome} (${agendamento.quando}, ${fuso})`);
  }
}

/** Roda uma rotina na hora, para testar sem esperar o relógio. */
export async function rodarAgora(
  nome: string,
  opcoes: { ctx: ActionContext; provider: LLMProvider; canal: Canal },
): Promise<void> {
  const agendamento = AGENDA.find((a) => a.nome === nome);
  if (!agendamento) {
    throw new Error(
      `Rotina desconhecida: ${nome}. Disponíveis: ${AGENDA.map((a) => a.nome).join(", ")}`,
    );
  }
  const resultado = await agendamento.executar(opcoes);
  console.log(resultado === null ? "(silenciada — nada a dizer)" : resultado);
}

export function canalDoWorker(): Canal | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return token && chatId ? new TelegramCanal(token, chatId) : null;
}
