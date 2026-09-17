import { describe, expect, it } from "vitest";
import { streak, valeHoje } from "./streak";

const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];
// 17/09/2026 é uma quinta-feira.
const HOJE = "2026-09-17";

describe("streak", () => {
  it("sem nenhum registro, a sequência é zero", () => {
    expect(streak(HOJE, TODOS_OS_DIAS, new Set())).toBe(0);
  });

  it("conta os dias seguidos até hoje", () => {
    const feitos = new Set(["2026-09-17", "2026-09-16", "2026-09-15"]);
    expect(streak(HOJE, TODOS_OS_DIAS, feitos)).toBe(3);
  });

  it("hoje em aberto não quebra a sequência de ontem", () => {
    const feitos = new Set(["2026-09-16", "2026-09-15"]);
    expect(streak(HOJE, TODOS_OS_DIAS, feitos)).toBe(2);
  });

  it("um dia em branco no meio encerra a contagem", () => {
    const feitos = new Set(["2026-09-16", "2026-09-14"]);
    expect(streak(HOJE, TODOS_OS_DIAS, feitos)).toBe(1);
  });

  it("hábito de seg/qua/sex ignora os dias em que não vale", () => {
    // Quinta não é dia do hábito; conta qua, seg, sex anterior...
    const segQuaSex = [1, 3, 5];
    const feitos = new Set(["2026-09-16", "2026-09-14", "2026-09-11"]);
    expect(streak(HOJE, segQuaSex, feitos)).toBe(3);
  });

  it("falta num dia do hábito quebra, mesmo com dias vizinhos feitos", () => {
    const segQuaSex = [1, 3, 5];
    // Faltou na segunda (14), então só a quarta conta.
    const feitos = new Set(["2026-09-16", "2026-09-11"]);
    expect(streak(HOJE, segQuaSex, feitos)).toBe(1);
  });
});

describe("valeHoje", () => {
  it("quinta-feira", () => {
    expect(valeHoje(HOJE, [4])).toBe(true);
    expect(valeHoje(HOJE, [1, 3, 5])).toBe(false);
    expect(valeHoje(HOJE, TODOS_OS_DIAS)).toBe(true);
  });
});
