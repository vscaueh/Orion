import { createBrowserClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/env";

// Cliente para componentes client-side. Usa a anon key (pública);
// quem protege os dados é a RLS no banco.
export function createClient() {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
