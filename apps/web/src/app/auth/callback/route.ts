import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Fim do fluxo OAuth: o Supabase redireciona para cá com um código
// temporário, que trocamos por uma sessão (gravada em cookies).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // O middleware decide o destino final: dono vai para o Hoje,
  // qualquer outra conta cai em /acesso-negado.
  return NextResponse.redirect(new URL("/", url.origin));
}
