// Janelas livres: o que sobra da semana-tipo depois dos compromissos.
// É a base do encaixe de tarefas que a Orion fará na Fase 4, então a
// lógica é pura — entra uma lista de intervalos, sai outra.

export interface Intervalo {
  /** Minutos desde a meia-noite. */
  inicio: number;
  fim: number;
}

/** Faixa do dia considerada aproveitável. Vai para a tabela settings. */
export const DIA_COMECA = 7 * 60;
export const DIA_TERMINA = 23 * 60;

/** Vão curto demais não serve para nada — nem vale mostrar. */
export const JANELA_MINIMA = 30;

/**
 * Junta intervalos que se sobrepõem ou se encostam. Sem isso, dois
 * compromissos sobrepostos deixariam um "vão" fantasma entre eles.
 */
export function unirIntervalos(
  intervalos: readonly Intervalo[],
): Intervalo[] {
  const ordenados = [...intervalos]
    .filter((i) => i.fim > i.inicio)
    .sort((a, b) => a.inicio - b.inicio);

  const unidos: Intervalo[] = [];
  for (const atual of ordenados) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && atual.inicio <= ultimo.fim) {
      ultimo.fim = Math.max(ultimo.fim, atual.fim);
    } else {
      unidos.push({ ...atual });
    }
  }
  return unidos;
}

/**
 * Os buracos entre os compromissos de um dia, dentro da faixa
 * aproveitável e com duração mínima útil.
 */
export function janelasLivres(
  ocupados: readonly Intervalo[],
  {
    diaComeca = DIA_COMECA,
    diaTermina = DIA_TERMINA,
    minima = JANELA_MINIMA,
  } = {},
): Intervalo[] {
  // Um compromisso que começa antes do dia ou termina depois só
  // interessa na parte que cai dentro da faixa.
  const dentroDaFaixa = ocupados
    .map((o) => ({
      inicio: Math.max(o.inicio, diaComeca),
      fim: Math.min(o.fim, diaTermina),
    }))
    .filter((o) => o.fim > o.inicio);

  const janelas: Intervalo[] = [];
  let cursor = diaComeca;

  for (const ocupado of unirIntervalos(dentroDaFaixa)) {
    if (ocupado.inicio - cursor >= minima) {
      janelas.push({ inicio: cursor, fim: ocupado.inicio });
    }
    cursor = Math.max(cursor, ocupado.fim);
  }

  if (diaTermina - cursor >= minima) {
    janelas.push({ inicio: cursor, fim: diaTermina });
  }

  return janelas;
}

export function duracao(intervalo: Intervalo): number {
  return intervalo.fim - intervalo.inicio;
}

/** Soma das janelas — quanto tempo livre o dia realmente tem. */
export function totalLivre(janelas: readonly Intervalo[]): number {
  return janelas.reduce((total, j) => total + duracao(j), 0);
}

interface BlocoComHorario {
  weekday: number;
  starts_at: string;
  ends_at: string;
}

/** Converte blocos da semana-tipo em intervalos de um dia da semana. */
export function intervalosDoDia(
  blocos: readonly BlocoComHorario[],
  diaSemana: number,
): Intervalo[] {
  const minutos = (hora: string) => {
    const [h = "0", m = "0"] = hora.split(":");
    return Number(h) * 60 + Number(m);
  };
  return blocos
    .filter((b) => b.weekday === diaSemana)
    .map((b) => ({ inicio: minutos(b.starts_at), fim: minutos(b.ends_at) }));
}

/** "14:00" a partir de minutos desde a meia-noite. */
export function formatarMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "1h30" ou "45 min" — para mostrar o tamanho de uma janela. */
export function descreverDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
