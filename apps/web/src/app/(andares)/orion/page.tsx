import { conversaAtual, historico, pendentes } from "@orion/orion";
import { createClient } from "@/lib/supabase/server";
import { Propostas } from "@/components/propostas";
import { conversarAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ctx = { supabase, userId: user.id };
  const conversaId = await conversaAtual(ctx, "web");
  const [mensagens, propostas] = await Promise.all([
    historico(ctx, conversaId, 40),
    pendentes(ctx),
  ]);

  // Mensagens de ferramenta são o encanamento do turno; quem conversa
  // vê só o que foi dito.
  const visiveis = mensagens.filter(
    (m) => m.role !== "tool" && m.content.trim() !== "",
  );

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

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
        {visiveis.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Pergunte alguma coisa. Ela sabe da sua faculdade, da sua rotina e
            dos seus projetos — por exemplo, &ldquo;quanto posso faltar em
            POO?&rdquo; ou &ldquo;anota que terminei a tarefa do
            cliente&rdquo;.
          </p>
        ) : null}

        {visiveis.map((mensagem, i) => (
          <div
            key={i}
            className={
              mensagem.role === "user"
                ? "ml-auto max-w-[80%] rounded-lg bg-zinc-800 px-4 py-2.5"
                : "max-w-[85%]"
            }
          >
            <p className="text-sm whitespace-pre-wrap text-zinc-200">
              {mensagem.content}
            </p>
          </div>
        ))}
      </div>

      <form action={conversarAction} className="mt-4 flex shrink-0 gap-2">
        <input
          name="mensagem"
          required
          autoComplete="off"
          placeholder="Fale com a Orion"
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-700"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
