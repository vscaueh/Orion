"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { conversarAction } from "@/app/(andares)/orion/actions";

export interface MensagemVisivel {
  role: "user" | "assistant";
  content: string;
}

/**
 * A conversa em si. É cliente por um motivo só: mostrar a mensagem do
 * usuário e o "pensando" na hora.
 *
 * O modelo leva segundos para responder — isso não tem como acelerar.
 * O que dá para tirar é a sensação de travamento: antes, a tela ficava
 * parada até a resposta chegar, sem sinal de que algo estava
 * acontecendo.
 */
export function Conversa({
  mensagens,
}: {
  mensagens: MensagemVisivel[];
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [comOtimista, adicionarOtimista] = useOptimistic(
    mensagens,
    (atuais, nova: MensagemVisivel) => [...atuais, nova],
  );

  function enviar(formData: FormData) {
    const texto = String(formData.get("mensagem") ?? "").trim();
    if (!texto) return;

    formRef.current?.reset();
    setErro(null);

    iniciarTransicao(async () => {
      adicionarOtimista({ role: "user", content: texto });
      try {
        await conversarAction(formData);
      } catch (e) {
        setErro(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
        {comOtimista.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Pergunte alguma coisa. Ela sabe da sua faculdade, da sua rotina e
            dos seus projetos — por exemplo, &ldquo;quanto posso faltar em
            POO?&rdquo; ou &ldquo;anota que terminei a tarefa do
            cliente&rdquo;.
          </p>
        ) : null}

        {comOtimista.map((mensagem, i) => (
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

        {pendente ? (
          <p className="text-sm text-zinc-500">
            <span className="inline-block animate-pulse">Orion está pensando…</span>
          </p>
        ) : null}

        {erro ? (
          <p className="text-sm text-red-400">Não deu certo: {erro}</p>
        ) : null}
      </div>

      <form ref={formRef} action={enviar} className="mt-4 flex shrink-0 gap-2">
        <input
          name="mensagem"
          required
          autoComplete="off"
          autoFocus
          disabled={pendente}
          placeholder={pendente ? "Aguardando resposta…" : "Fale com a Orion"}
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pendente}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </>
  );
}
