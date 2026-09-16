"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcessoNegadoPage() {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/entrar");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold text-zinc-50">Acesso negado</h1>
      <p className="max-w-sm text-center text-sm text-zinc-400">
        O Orion é um sistema pessoal. Esta conta Google não está
        autorizada a entrar.
      </p>
      <button
        onClick={sair}
        className="text-sm text-zinc-400 underline hover:text-zinc-100"
      >
        Sair e trocar de conta
      </button>
    </div>
  );
}
