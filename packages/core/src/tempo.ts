// Tempo é assunto de todos os andares, então mora na raiz do core.

/** Fuso padrão do usuário. Vai virar configuração na tabela settings. */
export const FUSO_PADRAO = "America/Fortaleza";

/** 0 = domingo … 6 = sábado, a partir de uma data ISO (YYYY-MM-DD). */
export function diaDaSemana(dataIso: string): number {
  const [ano = 0, mes = 1, dia = 1] = dataIso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export interface Agora {
  /** Data local no fuso, em ISO (YYYY-MM-DD). */
  dataIso: string;
  diaSemana: number;
  /** Minutos desde a meia-noite local. */
  minutos: number;
}

/**
 * O "agora" do usuário, não o do servidor. Sem isso, o Hoje visto de
 * Fortaleza às 22h já estaria mostrando o dia seguinte, porque o
 * servidor roda em UTC.
 */
export function agoraNoFuso(fuso = FUSO_PADRAO, quando = new Date()): Agora {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(quando);

  const valor = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "0";

  const dataIso = `${valor("year")}-${valor("month")}-${valor("day")}`;
  return {
    dataIso,
    diaSemana: diaDaSemana(dataIso),
    minutos: Number(valor("hour")) * 60 + Number(valor("minute")),
  };
}

/** Soma dias a uma data ISO, devolvendo outra data ISO. */
export function somarDias(dataIso: string, dias: number): string {
  const [ano = 0, mes = 1, dia = 1] = dataIso.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return d.toISOString().slice(0, 10);
}
