import { Sidebar } from "@/components/sidebar";
import { sessao } from "@/lib/sessao";

// Layout dos andares: tudo aqui dentro está atrás do login (garantido
// pelo middleware). O e-mail vem do servidor para a sidebar exibir.
export default async function AndaresLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const atual = await sessao();

  return (
    <div className="flex">
      <Sidebar email={atual?.email ?? null} />
      <main className="min-h-screen flex-1">{children}</main>
    </div>
  );
}
