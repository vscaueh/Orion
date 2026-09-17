import { describe, expect, it } from "vitest";
import {
  duracaoEmMinutos,
  duracaoUniformeEmMinutos,
  formatarHora,
  horaParaMinutos,
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

describe("duracaoUniformeEmMinutos", () => {
  it("encontros do mesmo tamanho", () => {
    expect(
      duracaoUniformeEmMinutos([
        { starts_at: "14:00:00", ends_at: "15:40:00" },
        { starts_at: "08:00:00", ends_at: "09:40:00" },
      ]),
    ).toBe(100);
  });

  it("encontros de tamanhos diferentes: null", () => {
    expect(
      duracaoUniformeEmMinutos([
        { starts_at: "14:00:00", ends_at: "15:40:00" },
        { starts_at: "08:00:00", ends_at: "08:50:00" },
      ]),
    ).toBeNull();
  });

  it("sem aula cadastrada: null", () => {
    expect(duracaoUniformeEmMinutos([])).toBeNull();
  });
});
