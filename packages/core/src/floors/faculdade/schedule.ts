// Utilidades de horário. Ficam separadas das notas porque servem tanto
// ao cálculo de faltas quanto à montagem da semana e do Hoje.

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
 * Duração dos encontros quando todos têm o mesmo tamanho; null quando
 * variam (aí "uma falta" não tem valor único) ou quando não há aula.
 */
export function duracaoUniformeEmMinutos(
  encontros: readonly { starts_at: string; ends_at: string }[],
): number | null {
  if (encontros.length === 0) return null;
  const duracoes = encontros.map((e) => duracaoEmMinutos(e.starts_at, e.ends_at));
  const primeira = duracoes[0]!;
  return duracoes.every((d) => d === primeira) ? primeira : null;
}
