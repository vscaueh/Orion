// Utilidades de horário. Ficam separadas das notas porque servem tanto
// ao cálculo de faltas quanto à montagem da semana e do Hoje.

// Uma hora-aula dura 50 minutos — é a unidade em que a carga horária é
// contada (uma cadeira de 72h são 72 horas-aula, não 72 relógios) e em
// que a UNIFOR registra faltas: perder um bloco de 100 min custa 2.
export const MINUTOS_POR_HORA_AULA = 50;

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const DIAS_SEMANA_CURTO = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

/** "14:00" ou "14:00:00" -> minutos desde a meia-noite. */
export function horaParaMinutos(hora: string): number {
  const [h = "0", m = "0"] = hora.split(":");
  return Number(h) * 60 + Number(m);
}

/** O Postgres devolve time como "14:00:00"; a interface mostra "14:00". */
export function formatarHora(hora: string): string {
  return hora.slice(0, 5);
}

export function duracaoEmMinutos(inicio: string, fim: string): number {
  return horaParaMinutos(fim) - horaParaMinutos(inicio);
}

/**
 * Duração de referência dos encontros da cadeira: a mais frequente.
 * Serve para falar em dias de aula quando a conta interna é em
 * horas-aula. Null quando a cadeira não tem horário cadastrado.
 */
export function duracaoTipicaEmMinutos(
  encontros: readonly { starts_at: string; ends_at: string }[],
): number | null {
  const vezes = new Map<number, number>();
  for (const e of encontros) {
    const d = duracaoEmMinutos(e.starts_at, e.ends_at);
    vezes.set(d, (vezes.get(d) ?? 0) + 1);
  }
  let tipica: number | null = null;
  let maior = 0;
  for (const [duracao, n] of vezes) {
    if (n > maior) {
      maior = n;
      tipica = duracao;
    }
  }
  return tipica;
}

/** Quantas horas-aula vale um encontro de N minutos. */
export function horasAulaPorEncontro(minutos: number): number {
  return Math.round(minutos / MINUTOS_POR_HORA_AULA);
}

/** 0 = domingo … 6 = sábado, a partir de uma data ISO (YYYY-MM-DD). */
export function diaDaSemana(dataIso: string): number {
  const [ano = 0, mes = 1, dia = 1] = dataIso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/**
 * Quanto custa, em horas-aula, faltar num dia — que é como a UNIFOR
 * conta. O valor sai do horário da cadeira naquele dia da semana.
 *
 * Numa data fora da grade (reposição, aula extra) não há horário para
 * consultar, então vale a duração típica dos encontros da cadeira.
 */
export function horasAulaEmData(
  dataIso: string,
  encontros: readonly { weekday: number; starts_at: string; ends_at: string }[],
): number {
  const custo = (e: { starts_at: string; ends_at: string }) =>
    horasAulaPorEncontro(duracaoEmMinutos(e.starts_at, e.ends_at));

  const doDia = encontros.filter((e) => e.weekday === diaDaSemana(dataIso));
  if (doDia.length > 0) return doDia.reduce((total, e) => total + custo(e), 0);

  const tipico = encontros[0];
  return tipico ? custo(tipico) : 0;
}
