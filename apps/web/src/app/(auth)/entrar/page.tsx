"use client";

import { createClient } from "@/lib/supabase/client";

export default function EntrarPage() {
  async function entrarComGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-widest text-zinc-50 uppercase">
          Orion
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sistema pessoal de vida com IA embutida
        </p>
      </div>
      <button
        onClick={entrarComGoogle}
        className="rounded-md border border-zinc-700 bg-zinc-950 px-5 py-2.5 text-sm text-zinc-100 transition-colors hover:bg-zinc-800"
      >
        Entrar com Google
      </button>
    </div>
  );
}
