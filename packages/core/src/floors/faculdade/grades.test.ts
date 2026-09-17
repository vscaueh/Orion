import { describe, expect, it } from "vitest";
import {
  aprovado,
  faltasRestantes,
  horasAulaEmDias,
  limiteFaltasEmHoras,
  notaNecessariaAv2,
  notaNecessariaAv3,
  podeFazerAv3,
} from "./grades";

describe("podeFazerAv3", () => {
  it("libera com média das parciais igual a 4", () => {
    expect(podeFazerAv3(4, 4)).toBe(true);
    expect(podeFazerAv3(2, 6)).toBe(true);
  });

  it("barra com média abaixo de 4", () => {
    expect(podeFazerAv3(3, 4.9)).toBe(false);
    expect(podeFazerAv3(0, 7.9)).toBe(false);
  });
});

describe("notaNecessariaAv2", () => {
  it("tirou 3 na AV1: precisa de 5 na AV2", () => {
    expect(notaNecessariaAv2(3)).toBe(5);
  });

  it("zerou a AV1: precisa de 8 na AV2", () => {
    expect(notaNecessariaAv2(0)).toBe(8);
  });

  it("AV1 alta: não fica negativa", () => {
    expect(notaNecessariaAv2(10)).toBe(0);
  });
});

describe("notaNecessariaAv3", () => {
  it("com 5 e 5: precisa de 5 na AV3", () => {
    expect(notaNecessariaAv3(5, 5)).toBe(5);
  });

  it("parciais no limite (soma 8): precisa de 7", () => {
    expect(notaNecessariaAv3(4, 4)).toBe(7);
  });

  it("parciais altas: o piso é a nota mínima da AV3 (4)", () => {
    // Média já garantida com 10 e 9, mas AV3 < 4 reprova sozinha.
    expect(notaNecessariaAv3(10, 9)).toBe(4);
  });

  it("AV3 não liberada: retorna null", () => {
    expect(notaNecessariaAv3(2, 3)).toBeNull();
  });
});

describe("aprovado", () => {
  it("caso comum: 5, 5 e 5 aprova", () => {
    expect(aprovado(5, 5, 5)).toBe(true);
  });

  it("AV3 abaixo de 4 reprova mesmo com média final sobrando", () => {
    expect(aprovado(10, 10, 3.9)).toBe(false);
  });

  it("média final abaixo de 5 reprova mesmo com AV3 boa", () => {
    expect(aprovado(4, 4, 6)).toBe(false); // média 4,67
  });

  it("sem liberar a AV3 não há aprovação", () => {
    expect(aprovado(2, 3, 10)).toBe(false);
  });
});

describe("limiteFaltasEmHoras", () => {
  it("cadeira de 64h: 16 horas-aula de falta", () => {
    expect(limiteFaltasEmHoras(64)).toBe(16);
  });

  it("cadeira de 72h: 18 horas-aula de falta", () => {
    expect(limiteFaltasEmHoras(72)).toBe(18);
  });

  it("cadeira de 36h: 9 horas-aula de falta", () => {
    expect(limiteFaltasEmHoras(36)).toBe(9);
  });

  it("carga que não divide certo arredonda para baixo", () => {
    expect(limiteFaltasEmHoras(30)).toBe(7); // 7,5
  });
});

describe("faltasRestantes", () => {
  it("desconta as faltas do limite", () => {
    expect(faltasRestantes(8, 0)).toBe(8);
    expect(faltasRestantes(8, 5)).toBe(3);
  });

  it("limite estourado fica negativo", () => {
    expect(faltasRestantes(8, 10)).toBe(-2);
  });
});

describe("horasAulaEmDias", () => {
  it("POO: 18 horas-aula de limite viram 9 dias", () => {
    expect(horasAulaEmDias(18, 100)).toBe(9);
  });

  it("cadeira de aula única por dia: 1 hora-aula = 1 dia", () => {
    expect(horasAulaEmDias(9, 50)).toBe(9);
  });

  it("limite estourado vira dias negativos", () => {
    expect(horasAulaEmDias(-3, 100)).toBe(-2);
  });

  it("encontro curto demais para uma hora-aula: null", () => {
    expect(horasAulaEmDias(18, 10)).toBeNull();
  });
});
