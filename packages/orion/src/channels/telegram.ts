import type { Canal, OpcoesDeEnvio } from "./canal";

const API = "https://api.telegram.org/bot";

/**
 * Envio pelo Telegram. O recebimento fica no worker, que é quem tem um
 * processo vivo para escutar — aqui só a saída, que qualquer lado pode
 * usar (inclusive o site, para avisar de algo fora da aba).
 */
export class TelegramCanal implements Canal {
  readonly nome = "telegram" as const;

  constructor(
    private readonly token: string,
    /** Conversa de destino. Um único usuário, um único chat. */
    private readonly chatId: string,
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {
    if (!token) throw new Error("TelegramCanal precisa de um token.");
  }

  async send(
    _userId: string,
    mensagem: string,
    opcoes?: OpcoesDeEnvio,
  ): Promise<void> {
    const corpo: Record<string, unknown> = {
      chat_id: this.chatId,
      text: mensagem,
    };

    if (opcoes?.botoes?.length) {
      corpo.reply_markup = {
        inline_keyboard: opcoes.botoes.map((linha) =>
          linha.map((b) => ({ text: b.texto, callback_data: b.dado })),
        ),
      };
    }

    const resposta = await this.fetchImpl(`${API}${this.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corpo),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      throw new Error(
        `Telegram recusou o envio (${resposta.status}): ${detalhe.slice(0, 200)}`,
      );
    }
  }
}
