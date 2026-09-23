import { contextoDoDono, provider } from "./ambiente";
import { iniciarBot } from "./telegram";

// O worker é onde a Orion vive fora do site: o bot agora, o agendador
// das rotinas na Fase 4. Ele chama a mesma função responder() que a web
// usa — nenhum dos dois reimplementa o turno.

async function main(): Promise<void> {
  const ctx = contextoDoDono();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(
      "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausentes — worker no ar sem o bot.",
    );
    // Segura o processo: na Fase 4 o agendador ocupa este lugar.
    await new Promise(() => {});
    return;
  }

  await iniciarBot({
    token,
    chatIdAutorizado: chatId,
    ctx,
    provider: provider(),
  });
}

main().catch((erro) => {
  console.error("Worker parou:", erro);
  process.exit(1);
});
