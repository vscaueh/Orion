import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

// Layout dos andares: tudo aqui dentro está atrás do login (garantido
// pelo middleware). O e-mail vem do servidor para a sidebar exibir.
export default async function AndaresLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex">
      <Sidebar email={user?.email ?? null} />
      <main className="min-h-screen flex-1">{children}</main>
    </div>
  );
}
