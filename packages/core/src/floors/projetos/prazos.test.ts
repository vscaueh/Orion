import { describe, expect, it } from "vitest";
import { diasParado, estaParado, tarefasComPrazo } from "./prazos";

const HOJE = "2026-09-17";
const tarefa = (
  id: string,
  due_on: string | null,
  priority: "alta" | "media" | "baixa" = "media",
  completed_at: string | null = null,
) => ({ id, due_on, priority, completed_at });

describe("tarefasComPrazo", () => {
  it("pega as em aberto com prazo dentro da janela", () => {
    const tarefas = [
      tarefa("hoje", "2026-09-17"),
      tarefa("em-7", "2026-09-24"),
      tarefa("em-8", "2026-09-25"),
      tarefa("sem-prazo", null),
    ];
    expect(tarefasComPrazo(HOJE, tarefas).map((t) => t.id)).toEqual([
      "hoje",
      "em-7",
    ]);
  });

  it("tarefa atrasada aparece primeiro", () => {
    const tarefas = [tarefa("hoje", "2026-09-17"), tarefa("atrasada", "2026-09-10")];
    expect(tarefasComPrazo(HOJE, tarefas).map((t) => t.id)).toEqual([
      "atrasada",
      "hoje",
    ]);
  });

  it("no mesmo dia, a prioridade desempata", () => {
    const tarefas = [
      tarefa("baixa", "2026-09-18", "baixa"),
      tarefa("alta", "2026-09-18", "alta"),
      tarefa("media", "2026-09-18", "media"),
    ];
    expect(tarefasComPrazo(HOJE, tarefas).map((t) => t.id)).toEqual([
      "alta",
      "media",
      "baixa",
    ]);
  });

  it("tarefa concluída não aparece, mesmo com prazo próximo", () => {
    const tarefas = [tarefa("feita", "2026-09-18", "alta", "2026-09-16T10:00:00Z")];
    expect(tarefasComPrazo(HOJE, tarefas)).toEqual([]);
  });
});

describe("diasParado", () => {
  it("conta desde a última alteração", () => {
    expect(diasParado(HOJE, "2026-09-10T14:00:00Z")).toBe(7);
    expect(diasParado(HOJE, "2026-09-17T08:00:00Z")).toBe(0);
  });

  it("alteração no futuro não vira número negativo", () => {
    expect(diasParado(HOJE, "2026-09-20T08:00:00Z")).toBe(0);
  });
});

describe("estaParado", () => {
  it("duas semanas sem mexer conta como parado", () => {
    expect(estaParado(HOJE, "2026-09-03T10:00:00Z")).toBe(true);
    expect(estaParado(HOJE, "2026-09-04T10:00:00Z")).toBe(false);
  });
});
