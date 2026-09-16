import { FLOORS } from "@orion/core";

// Placeholder da Fase 0: cada andar mostra nome e descrição até ganhar
// sua tela de verdade na fase correspondente.
export function FloorPage({ floorId }: { floorId: string }) {
  const floor = FLOORS.find((f) => f.id === floorId);
  if (!floor) throw new Error(`Andar desconhecido: ${floorId}`);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-50">{floor.nome}</h1>
      <p className="mt-2 max-w-prose text-sm text-zinc-400">{floor.descricao}</p>
      <p className="mt-8 text-xs text-zinc-600">
        Este andar ainda está em construção.
      </p>
    </div>
  );
}
