import { describe, expect, it } from "vitest";
import { agoraNoFuso, diaDaSemana, periodoDoDia, somarDias } from "./tempo";

describe("periodoDoDia", () => {
  it("separa os quatro períodos", () => {
    expect(periodoDoDia(3 * 60)).toBe("madrugada");
    expect(periodoDoDia(9 * 60)).toBe("manha");
    expect(periodoDoDia(15 * 60)).toBe("tarde");
    expect(periodoDoDia(21 * 60)).toBe("noite");
  });

  it("as viradas caem no período seguinte", () => {
    expect(periodoDoDia(4 * 60 + 59)).toBe("madrugada");
    expect(periodoDoDia(5 * 60)).toBe("manha");
    expect(periodoDoDia(11 * 60 + 59)).toBe("manha");
    expect(periodoDoDia(12 * 60)).toBe("tarde");
    expect(periodoDoDia(18 * 60)).toBe("noite");
  });

  it("meia-noite é madrugada, não noite", () => {
    expect(periodoDoDia(0)).toBe("madrugada");
  });
});

describe("agoraNoFuso", () => {
  it("usa o fuso do usuário, não o do servidor", () => {
    // 17/09/2026 às 01:00 UTC ainda é dia 16 em Fortaleza (UTC-3).
    const agora = agoraNoFuso(
      "America/Fortaleza",
      new Date("2026-09-17T01:00:00Z"),
    );
    expect(agora.dataIso).toBe("2026-09-16");
    expect(agora.minutos).toBe(22 * 60);
    expect(agora.diaSemana).toBe(3);
  });
});

describe("somarDias", () => {
  it("atravessa a virada do mês", () => {
    expect(somarDias("2026-09-30", 2)).toBe("2026-10-02");
  });

  it("aceita voltar no tempo", () => {
    expect(somarDias("2026-10-01", -1)).toBe("2026-09-30");
  });
});

describe("diaDaSemana", () => {
  it("14/09/2026 é segunda", () => {
    expect(diaDaSemana("2026-09-14")).toBe(1);
  });
});
