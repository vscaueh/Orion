import { conversaAtual, historico, pendentes } from "@orion/orion";
import { Conversa, type MensagemVisivel } from "@/components/conversa";
import { Propostas } from "@/components/propostas";
import { sessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function OrionPage() {
  const ctx = await sessao();
  if (!ctx) return null; // o middleware não deixa chegar aqui deslogado

  const conversaId = await conversaAtual(ctx, "web");
  const [mensagens, propostas] = await Promise.all([
    historico(ctx, conversaId, 40),
    pendentes(ctx),
  ]);

  // Mensagens de ferramenta são o encanamento do turno; quem conversa
  // vê só o que foi dito.
  const visiveis: MensagemVisivel[] = mensagens
    .filter((m) => m.role !== "tool" && m.content.trim() !== "")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  return (
    <div className="flex h-screen max-w-2xl flex-col p-8">
      <header className="shrink-0">
        <h1 className="text-2xl font-semibold text-zinc-50">Orion</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ela conhece seus andares e age através deles. Toda mudança vira
          proposta para você aprovar.
        </p>
      </header>

      {propostas.length > 0 ? (
        <div className="mt-6 shrink-0">
          <Propostas propostas={propostas} />
        </div>
      ) : null}

      <Conversa mensagens={visiveis} />
    </div>
  );
}
