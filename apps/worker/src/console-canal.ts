import type { Canal, OpcoesDeEnvio } from "@orion/orion";

/**
 * Canal de terminal, para testar rotina sem depender do Telegram.
 * Exigir um bot configurado só para ver o texto de uma rotina atrasa o
 * trabalho sem proteger nada.
 */
export class ConsoleCanal implements Canal {
  readonly nome = "console" as const;

  async send(
    _userId: string,
    mensagem: string,
    opcoes?: OpcoesDeEnvio,
  ): Promise<void> {
    console.log("\n┌─ Orion ─────────────────────────────");
    for (const linha of mensagem.split("\n")) {
      console.log(`│ ${linha}`);
    }
    for (const linha of opcoes?.botoes ?? []) {
      console.log(`│ [${linha.map((b) => b.texto).join("] [")}]`);
    }
    console.log("└─────────────────────────────────────\n");
  }
}
