import { describe, expect, it } from "vitest";
import {
  diaDaSemana,
  duracaoEmMinutos,
  duracaoTipicaEmMinutos,
  formatarHora,
  horaParaMinutos,
  horasAulaEmData,
  horasAulaPorEncontro,
} from "./schedule";

describe("horaParaMinutos", () => {
  it("converte hora do Postgres e da interface igual", () => {
    expect(horaParaMinutos("14:00:00")).toBe(840);
    expect(horaParaMinutos("14:00")).toBe(840);
  });
});

describe("formatarHora", () => {
  it("corta os segundos", () => {
    expect(formatarHora("14:00:00")).toBe("14:00");
  });
});

describe("duracaoEmMinutos", () => {
  it("aula de 14:00 às 15:40 dura 100 min", () => {
    expect(duracaoEmMinutos("14:00:00", "15:40:00")).toBe(100);
  });
});

describe("duracaoTipicaEmMinutos", () => {
  it("encontros do mesmo tamanho", () => {
    expect(
      duracaoTipicaEmMinutos([
        { starts_at: "14:00:00", ends_at: "15:40:00" },
        { starts_at: "08:00:00", ends_at: "09:40:00" },
      ]),
    ).toBe(100);
  });

  it("formatos mistos: vale a duração mais frequente", () => {
    expect(
      duracaoTipicaEmMinutos([
        { starts_at: "14:00:00", ends_at: "15:40:00" },
        { starts_at: "08:00:00", ends_at: "09:40:00" },
        { starts_at: "10:00:00", ends_at: "10:50:00" },
      ]),
    ).toBe(100);
  });

  it("sem aula cadastrada: null", () => {
    expect(duracaoTipicaEmMinutos([])).toBeNull();
  });
});

describe("horasAulaPorEncontro", () => {
  it("100 minutos são duas aulas de 50", () => {
    expect(horasAulaPorEncontro(100)).toBe(2);
  });

  it("intervalo entre as duas aulas não vira uma terceira", () => {
    expect(horasAulaPorEncontro(110)).toBe(2);
  });
});

describe("diaDaSemana", () => {
  it("14/09/2026 é segunda", () => {
    expect(diaDaSemana("2026-09-14")).toBe(1);
  });

  it("16/09/2026 é quarta", () => {
    expect(diaDaSemana("2026-09-16")).toBe(3);
  });
});

describe("horasAulaEmData", () => {
  // POO: 72h, segunda e quarta, dois blocos de 50 min seguidos.
  const poo = [
    { weekday: 1, starts_at: "14:00:00", ends_at: "15:40:00" },
    { weekday: 3, starts_at: "14:00:00", ends_at: "15:40:00" },
  ];

  it("faltar numa segunda de POO custa 2 horas-aula", () => {
    expect(horasAulaEmData("2026-09-14", poo)).toBe(2);
  });

  it("dia sem aula da cadeira usa a duração típica (reposição)", () => {
    expect(horasAulaEmData("2026-09-17", poo)).toBe(2);
  });

  it("duas aulas da mesma cadeira no mesmo dia somam", () => {
    const dobrado = [
      { weekday: 1, starts_at: "08:00:00", ends_at: "09:40:00" },
      { weekday: 1, starts_at: "10:00:00", ends_at: "10:50:00" },
    ];
    expect(horasAulaEmData("2026-09-14", dobrado)).toBe(3);
  });

  it("cadeira sem horário cadastrado: zero", () => {
    expect(horasAulaEmData("2026-09-14", [])).toBe(0);
  });
});
