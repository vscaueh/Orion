import { somarDias } from "../../tempo";
import type { Prioridade } from "./schema";

/** Depois de quantos dias sem mexer um projeto conta como parado. */
export const DIAS_PARA_PARADO = 14;

const PESO: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 };

interface TemPrazo {
  due_on: string | null;
  completed_at: string | null;
  priority: Prioridade;
}

/**
 * Tarefas em aberto com prazo dentro da janela, das mais urgentes para
 * as menos. Tarefa atrasada vem primeiro — o prazo já passou.
 */
export function tarefasComPrazo<T extends TemPrazo>(
  hojeIso: string,
  tarefas: readonly T[],
  dias = 7,
): T[] {
  const limite = somarDias(hojeIso, dias);
  return tarefas
    .filter(
      (t) => t.completed_at === null && t.due_on !== null && t.due_on <= limite,
    )
    .sort(
      (a, b) =>
        a.due_on!.localeCompare(b.due_on!) ||
        PESO[a.priority] - PESO[b.priority],
    );
}

/**
 * Há quantos dias o projeto não recebe nada. Na Fase 5 o GitHub vai
 * alimentar isso; por ora vale a última alteração no próprio projeto.
 */
export function diasParado(hojeIso: string, updatedAt: string): number {
  const dia = 24 * 60 * 60 * 1000;
  const paraMs = (iso: string) => {
    const [a = 0, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.max(0, Math.round((paraMs(hojeIso) - paraMs(updatedAt)) / dia));
}

export function estaParado(hojeIso: string, updatedAt: string): boolean {
  return diasParado(hojeIso, updatedAt) >= DIAS_PARA_PARADO;
}
