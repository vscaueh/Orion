import { describe, expect, it } from "vitest";
import { diasAte, proximaAula, provasProximas } from "./resumo";

// POO segunda e quarta 14:00, Cálculo terça 08:00.
const aulas = [
  { id: "poo-seg", weekday: 1, starts_at: "14:00:00" },
  { id: "poo-qua", weekday: 3, starts_at: "14:00:00" },
  { id: "calc-ter", weekday: 2, starts_at: "08:00:00" },
];

describe("proximaAula", () => {
  it("na segunda de manhã, a próxima é a POO da tarde", () => {
    const r = proximaAula(1, 9 * 60, aulas)!;
    expect(r.aula.id).toBe("poo-seg");
    expect(r.diasAFrente).toBe(0);
    expect(r.minutosAte).toBe(300);
  });

  it("depois da aula começar, ela não conta mais", () => {
    const r = proximaAula(1, 14 * 60 + 30, aulas)!;
    expect(r.aula.id).toBe("calc-ter");
    expect(r.diasAFrente).toBe(1);
  });

  it("a semana dá a volta: no sábado, a próxima é a segunda", () => {
    const r = proximaAula(6, 10 * 60, aulas)!;
    expect(r.aula.id).toBe("poo-seg");
    expect(r.diasAFrente).toBe(2);
  });

  it("aula que já passou hoje volta só na semana seguinte", () => {
    const so = [{ id: "unica", weekday: 1, starts_at: "08:00:00" }];
    expect(proximaAula(1, 10 * 60, so)!.diasAFrente).toBe(7);
  });

  it("sem aulas cadastradas: null", () => {
    expect(proximaAula(1, 600, [])).toBeNull();
  });
});

describe("provasProximas", () => {
  const avaliacoes = [
    { id: "hoje", date: "2026-09-17" },
    { id: "em-3", date: "2026-09-20" },
    { id: "em-14", date: "2026-10-01" },
    { id: "em-15", date: "2026-10-02" },
    { id: "ontem", date: "2026-09-16" },
    { id: "sem-data", date: null },
  ];

  it("pega de hoje até o 14º dia, em ordem", () => {
    expect(provasProximas("2026-09-17", avaliacoes).map((a) => a.id)).toEqual([
      "hoje",
      "em-3",
      "em-14",
    ]);
  });

  it("prova que já passou não aparece", () => {
    expect(provasProximas("2026-09-17", avaliacoes).map((a) => a.id)).not.toContain(
      "ontem",
    );
  });

  it("a janela é configurável", () => {
    expect(
      provasProximas("2026-09-17", avaliacoes, 3).map((a) => a.id),
    ).toEqual(["hoje", "em-3"]);
  });
});

describe("diasAte", () => {
  it("hoje é 0, amanhã é 1", () => {
    expect(diasAte("2026-09-17", "2026-09-17")).toBe(0);
    expect(diasAte("2026-09-17", "2026-09-18")).toBe(1);
  });

  it("atravessa a virada do mês", () => {
    expect(diasAte("2026-09-30", "2026-10-02")).toBe(2);
  });
});
