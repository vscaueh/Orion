import { canalDoWorker, iniciarAgendador, rodarAgora } from "./agendador";
import { contextoDoDono, provider } from "./ambiente";
import { ConsoleCanal } from "./console-canal";
import { iniciarBot } from "./telegram";

// O worker é onde a Orion vive fora do site: o agendador das rotinas e
// o bot do Telegram, no mesmo processo.
//
// `pnpm start -- rodar "montar o dia"` executa uma rotina na hora, sem
// esperar o relógio — é como se testa sem fingir que são 7h.

async function main(): Promise<void> {
  const ctx = contextoDoDono();
  const canal = canalDoWorker();

  // O "--" de `pnpm start -- rodar ...` chega aqui como argumento.
  const argumentos = process.argv.slice(2).filter((a) => a !== "--");
  const [comando, rotina] = argumentos;

  if (comando === "rodar") {
    if (!rotina) throw new Error('Diga qual rotina: rodar "montar o dia"');
    // Sem Telegram configurado, a rotina imprime no terminal — dá para
    // ver o texto antes de ter bot.
    await rodarAgora(rotina, {
      ctx,
      provider: provider(),
      canal: canal ?? new ConsoleCanal(),
    });
    return;
  }

  if (!canal) {
    console.log(
      "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausentes — as rotinas não têm por onde falar.",
    );
    return;
  }

  await iniciarAgendador({ ctx, provider: provider(), canal });

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  await iniciarBot({ token, chatIdAutorizado: chatId, ctx, provider: provider() });
}

main().catch((erro) => {
  console.error("Worker parou:", erro);
  process.exit(1);
});
