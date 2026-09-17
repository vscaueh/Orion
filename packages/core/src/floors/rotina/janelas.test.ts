import { describe, expect, it } from "vitest";
import { janelasLivres, totalLivre, unirIntervalos } from "./janelas";

const h = (hora: number, min = 0) => hora * 60 + min;

describe("unirIntervalos", () => {
  it("junta os que se sobrepõem", () => {
    expect(
      unirIntervalos([
        { inicio: h(8), fim: h(10) },
        { inicio: h(9), fim: h(11) },
      ]),
    ).toEqual([{ inicio: h(8), fim: h(11) }]);
  });

  it("junta os que se encostam", () => {
    expect(
      unirIntervalos([
        { inicio: h(8), fim: h(10) },
        { inicio: h(10), fim: h(12) },
      ]),
    ).toEqual([{ inicio: h(8), fim: h(12) }]);
  });

  it("mantém separados os que têm vão entre si", () => {
    const separados = [
      { inicio: h(8), fim: h(10) },
      { inicio: h(14), fim: h(16) },
    ];
    expect(unirIntervalos(separados)).toEqual(separados);
  });

  it("ordena antes de juntar", () => {
    expect(
      unirIntervalos([
        { inicio: h(14), fim: h(16) },
        { inicio: h(8), fim: h(10) },
      ]),
    ).toEqual([
      { inicio: h(8), fim: h(10) },
      { inicio: h(14), fim: h(16) },
    ]);
  });
});

describe("janelasLivres", () => {
  it("dia sem compromisso é uma janela só", () => {
    expect(janelasLivres([])).toEqual([{ inicio: h(7), fim: h(23) }]);
  });

  it("uma aula à tarde parte o dia em duas janelas", () => {
    expect(janelasLivres([{ inicio: h(14), fim: h(15, 40) }])).toEqual([
      { inicio: h(7), fim: h(14) },
      { inicio: h(15, 40), fim: h(23) },
    ]);
  });

  it("vão menor que o mínimo não vira janela", () => {
    // 20 minutos entre as duas aulas: não dá para fazer nada.
    const janelas = janelasLivres([
      { inicio: h(8), fim: h(10) },
      { inicio: h(10, 20), fim: h(12) },
    ]);
    expect(janelas).toEqual([
      { inicio: h(7), fim: h(8) },
      { inicio: h(12), fim: h(23) },
    ]);
  });

  it("compromissos sobrepostos não criam janela fantasma", () => {
    // O bloco menor está dentro do maior: entre 9h e 10h não há vão.
    expect(
      janelasLivres([
        { inicio: h(8), fim: h(12) },
        { inicio: h(9), fim: h(10) },
      ]),
    ).toEqual([
      { inicio: h(7), fim: h(8) },
      { inicio: h(12), fim: h(23) },
    ]);
  });

  it("o que cai fora da faixa do dia é ignorado", () => {
    // Sono das 23h às 7h não deve encolher a faixa aproveitável.
    expect(janelasLivres([{ inicio: h(0), fim: h(7) }])).toEqual([
      { inicio: h(7), fim: h(23) },
    ]);
  });

  it("dia cheio não sobra nada", () => {
    expect(janelasLivres([{ inicio: h(6), fim: h(23, 30) }])).toEqual([]);
  });

  it("a faixa do dia é configurável", () => {
    expect(
      janelasLivres([], { diaComeca: h(9), diaTermina: h(18) }),
    ).toEqual([{ inicio: h(9), fim: h(18) }]);
  });
});

describe("totalLivre", () => {
  it("soma as janelas", () => {
    const janelas = janelasLivres([{ inicio: h(14), fim: h(16) }]);
    expect(totalLivre(janelas)).toBe(7 * 60 + 7 * 60); // 7h de manhã + 7h à noite
  });
});
