"use client";

import { useEffect } from "react";

/**
 * Rede oscila, sessão expira, banco recusa um token por um segundo. Sem
 * isto, qualquer uma dessas falhas derruba o andar inteiro numa tela de
 * erro do Next sem saída. Aqui o usuário lê o que houve e tenta de novo.
 */
export default function ErroNoAndar({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const sessao = /jwt|token|sess|auth/i.test(error.message);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-lg font-medium text-zinc-100">
        {sessao ? "Sua sessão travou" : "Alguma coisa quebrou aqui"}
      </h1>

      <p className="max-w-sm text-center text-sm text-zinc-400">
        {sessao
          ? "Costuma ser passageiro. Tente de novo; se insistir, saia e entre novamente."
          : "O erro foi registrado no console do navegador."}
      </p>

      <p className="max-w-lg text-center font-mono text-xs break-words text-zinc-600">
        {error.message}
      </p>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-700"
        >
          Tentar de novo
        </button>
        <a
          href="/entrar"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          Ir para o login
        </a>
      </div>
    </div>
  );
}
