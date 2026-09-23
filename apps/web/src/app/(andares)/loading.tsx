/**
 * O Next mostra isto enquanto o servidor busca os dados do andar. Sem
 * ele, a tela anterior fica congelada e a navegação parece travada —
 * o tempo é o mesmo, a sensação não.
 */
export default function Carregando() {
  return (
    <div className="max-w-2xl space-y-6 p-8">
      <div className="h-7 w-40 animate-pulse rounded bg-zinc-800" />
      <div className="h-4 w-64 animate-pulse rounded bg-zinc-900" />
      <div className="space-y-2 pt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-md border border-zinc-800 bg-zinc-900/50"
          />
        ))}
      </div>
    </div>
  );
}
