import type { Canal, OpcoesDeEnvio } from "./canal";

/**
 * Stub com a interface pronta. O WhatsApp entra depois do Telegram, via
 * Evolution API num número secundário — nunca no principal, conforme a
 * decisão registrada no CLAUDE.md.
 */
export class WhatsappCanal implements Canal {
  readonly nome = "whatsapp" as const;

  async send(
    _userId: string,
    _mensagem: string,
    _opcoes?: OpcoesDeEnvio,
  ): Promise<void> {
    throw new Error("Canal do WhatsApp ainda não implementado.");
  }
}
