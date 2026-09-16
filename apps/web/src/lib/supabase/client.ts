import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes client-side. Usa a publishable key (pública);
// quem protege os dados é a RLS no banco.
//
// As variáveis precisam ser acessadas com o nome literal
// (process.env.NEXT_PUBLIC_...): o Next injeta os valores no build por
// substituição de texto. Um acesso dinâmico como process.env[nome]
// chega ao navegador como undefined mesmo com a variável definida.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não definida. Veja apps/web/.env.example.",
    );
  }

  return createBrowserClient(url, key);
}
