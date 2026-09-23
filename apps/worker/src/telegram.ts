import { aprovar, rejeitar, responder, TelegramCanal } from "@orion/orion";
import type { ActionContext } from "@orion/core";
import type { LLMProvider } from "@orion/orion";

// Recebimento por long polling: o worker pergunta ao Telegram se há
// novidade e fica esperando. Sem webhook, sem URL pública, sem túnel —
// funciona igual rodando no Codespaces ou numa VPS.

const API = "https://api.telegram.org/bot";

interface Update {
  update_id: number;
  message?: { chat: { id: number }; text?: string; from?: { id: number } };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number } };
    from?: { id: number };
  };
}

export interface OpcoesDoBot {
  token: string;
  /** Só este chat é atendido: o sistema é de um usuário só. */
  chatIdAutorizado: string;
  ctx: ActionContext;
  provider: LLMProvider;
}

export async function iniciarBot(opcoes: OpcoesDoBot): Promise<void> {
  const canal = new TelegramCanal(opcoes.token, opcoes.chatIdAutorizado);
  let offset = 0;

  console.log("Bot do Telegram escutando.");

  for (;;) {
    try {
      const updates = await buscarUpdates(opcoes.token, offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        await tratarUpdate(update, canal, opcoes);
      }
    } catch (erro) {
      // Uma falha de rede não pode matar o worker: espera e tenta de novo.
      console.error("Erro no ciclo do bot:", erro);
      await esperar(5000);
    }
  }
}

async function buscarUpdates(token: string, offset: number): Promise<Update[]> {
  const resposta = await fetch(
    `${API}${token}/getUpdates?offset=${offset}&timeout=30`,
    { signal: AbortSignal.timeout(40_000) },
  );
  if (!resposta.ok) throw new Error(`getUpdates falhou: ${resposta.status}`);
  const json = (await resposta.json()) as { result?: Update[] };
  return json.result ?? [];
}

async function tratarUpdate(
  update: Update,
  canal: TelegramCanal,
  { token, chatIdAutorizado, ctx, provider }: OpcoesDoBot,
): Promise<void> {
  // Botão de proposta.
  if (update.callback_query) {
    const { id, data, message } = update.callback_query;
    if (String(message?.chat.id) !== chatIdAutorizado) return;

    const [acao, propostaId] = (data ?? "").split(":");
    let aviso = "Não entendi esse botão.";

    if (acao === "aprovar" && propostaId) {
      const r = await aprovar(ctx, propostaId);
      aviso = r.ok ? "Aprovado e executado." : `Não deu: ${r.erro}`;
    } else if (acao === "rejeitar" && propostaId) {
      await rejeitar(ctx, propostaId);
      aviso = "Rejeitado.";
    }

    await responderCallback(token, id, aviso);
    await canal.send(ctx.userId, aviso);
    return;
  }

  // Mensagem de texto.
  const mensagem = update.message;
  if (!mensagem?.text) return;
  if (String(mensagem.chat.id) !== chatIdAutorizado) {
    // Qualquer um pode achar o bot; só o dono conversa com ele.
    console.warn(`Mensagem ignorada do chat ${mensagem.chat.id}.`);
    return;
  }

  try {
    const { resposta, propostasCriadas } = await responder({
      ctx,
      provider,
      texto: mensagem.text,
      canal: "telegram",
    });

    await canal.send(ctx.userId, resposta || "(sem resposta)");
    if (propostasCriadas > 0) {
      await canal.send(
        ctx.userId,
        `${propostasCriadas} ${propostasCriadas === 1 ? "proposta pendente" : "propostas pendentes"} — aprove pelo site ou aqui.`,
      );
    }
  } catch (erro) {
    console.error("Erro ao responder:", erro);
    await canal.send(
      ctx.userId,
      `Deu erro aqui: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
  }
}

async function responderCallback(
  token: string,
  callbackId: string,
  texto: string,
): Promise<void> {
  // Sem isto o Telegram deixa o botão "carregando" para sempre.
  await fetch(`${API}${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text: texto }),
  });
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
