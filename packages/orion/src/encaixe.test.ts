import { describe, expect, it } from "vitest";
import { encaixarTarefas, type TarefaParaEncaixar } from "./encaixe";

const h = (hora: number, min = 0) => hora * 60 + min;

const tarefa = (
  id: string,
  duracaoMin: number,
  prioridade: "alta" | "media" | "baixa" = "media",
  prazo: string | null = null,
): TarefaParaEncaixar => ({ id, titulo: id, duracaoMin, prioridade, prazo });

// Dia com aula das 14h às 15h40: livre de manhã e à noite.
const janelasDoDia = [
  { inicio: h(7), fim: h(14) },
  { inicio: h(15, 40), fim: h(23) },
];

describe("encaixarTarefas", () => {
  it("coloca a tarefa no começo da primeira janela que cabe", () => {
    const { encaixes } = encaixarTarefas([tarefa("a", 90)], janelasDoDia);
    expect(encaixes).toHaveLength(1);
    expect(encaixes[0]).toMatchObject({ inicio: h(7), fim: h(8, 30) });
  });

  it("enfileira uma depois da outra, sem sobrepor", () => {
    const { encaixes } = encaixarTarefas(
      [tarefa("longa", 60), tarefa("curta", 30)],
      janelasDoDia,
    );
    // Empatadas em prazo e prioridade, a mais curta vai primeiro.
    expect(encaixes.map((e) => [e.tarefa.id, e.inicio, e.fim])).toEqual([
      ["curta", h(7), h(7, 30)],
      ["longa", h(7, 30), h(8, 30)],
    ]);
  });

  it("pula a janela pequena demais em vez de invadir o compromisso", () => {
    // 7h10 não cabe nas 7h da manhã; cabe nas 7h20 da noite.
    const { encaixes } = encaixarTarefas(
      [tarefa("grande", 7 * 60 + 10)],
      janelasDoDia,
      { maxFocoMin: 10 * 60 },
    );
    expect(encaixes[0]).toMatchObject({ inicio: h(15, 40), fim: h(22, 50) });
  });

  it("prazo mais próximo vem primeiro", () => {
    const { encaixes } = encaixarTarefas(
      [
        tarefa("depois", 60, "alta", "2026-10-01"),
        tarefa("urgente", 60, "baixa", "2026-09-24"),
      ],
      janelasDoDia,
    );
    expect(encaixes.map((e) => e.tarefa.id)).toEqual(["urgente", "depois"]);
  });

  it("no mesmo prazo, a prioridade desempata", () => {
    const { encaixes } = encaixarTarefas(
      [
        tarefa("baixa", 60, "baixa", "2026-09-24"),
        tarefa("alta", 60, "alta", "2026-09-24"),
      ],
      janelasDoDia,
    );
    expect(encaixes.map((e) => e.tarefa.id)).toEqual(["alta", "baixa"]);
  });

  it("tarefa sem prazo fica para o fim da fila", () => {
    const { encaixes } = encaixarTarefas(
      [tarefa("sem-prazo", 60, "alta"), tarefa("com-prazo", 60, "baixa", "2026-10-01")],
      janelasDoDia,
    );
    expect(encaixes.map((e) => e.tarefa.id)).toEqual(["com-prazo", "sem-prazo"]);
  });

  it("respeita o teto de foco do dia", () => {
    const tarefas = [tarefa("a", 120), tarefa("b", 120), tarefa("c", 120)];
    const { encaixes, naoCoube } = encaixarTarefas(tarefas, janelasDoDia, {
      maxFocoMin: 4 * 60,
    });

    expect(encaixes).toHaveLength(2);
    expect(naoCoube.map((t) => t.id)).toEqual(["c"]);
  });

  it("uma tarefa longa demais não bloqueia as curtas atrás dela", () => {
    const { encaixes, naoCoube } = encaixarTarefas(
      [tarefa("enorme", 300), tarefa("curta", 30)],
      janelasDoDia,
      { maxFocoMin: 60 },
    );

    expect(encaixes.map((e) => e.tarefa.id)).toEqual(["curta"]);
    expect(naoCoube.map((t) => t.id)).toEqual(["enorme"]);
  });

  it("ignora o que já passou e aproveita o resto da janela em curso", () => {
    const { encaixes } = encaixarTarefas([tarefa("a", 60)], janelasDoDia, {
      agora: h(10),
    });
    expect(encaixes[0]!.inicio).toBe(h(10));
  });

  it("sem janela livre, nada é encaixado", () => {
    const { encaixes, naoCoube } = encaixarTarefas([tarefa("a", 60)], []);
    expect(encaixes).toEqual([]);
    expect(naoCoube.map((t) => t.id)).toEqual(["a"]);
  });

  it("dia acabando: a janela da noite já passou", () => {
    const { encaixes } = encaixarTarefas([tarefa("a", 60)], janelasDoDia, {
      agora: h(23),
    });
    expect(encaixes).toEqual([]);
  });
});
