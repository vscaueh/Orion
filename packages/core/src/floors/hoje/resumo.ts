import { diaDaSemana, somarDias } from "../../tempo";
import { horaParaMinutos } from "../faculdade/schedule";

// Funções puras do Hoje. Recebem o "agora" já resolvido no fuso do
// usuário, o que as mantém testáveis sem depender do relógio.

export interface ProximaAula<T> {
  aula: T;
  /** 0 = hoje, 1 = amanhã. */
  diasAFrente: number;
  minutosAte: number;
}

interface TemHorario {
  weekday: number;
  starts_at: string;
}

/**
 * A próxima aula a acontecer, olhando a semana como um ciclo. Uma aula
 * que já começou hoje fica para a semana que vem.
 */
export function proximaAula<T extends TemHorario>(
  diaSemanaAgora: number,
  minutosAgora: number,
  aulas: readonly T[],
): ProximaAula<T> | null {
  let melhor: ProximaAula<T> | null = null;

  for (const aula of aulas) {
    const inicio = horaParaMinutos(aula.starts_at);
    let diasAFrente = (aula.weekday - diaSemanaAgora + 7) % 7;
    if (diasAFrente === 0 && inicio <= minutosAgora) diasAFrente = 7;

    const minutosAte = diasAFrente * 24 * 60 + inicio - minutosAgora;
    if (melhor === null || minutosAte < melhor.minutosAte) {
      melhor = { aula, diasAFrente, minutosAte };
    }
  }

  return melhor;
}

interface TemData {
  date: string | null;
}

/**
 * Avaliações marcadas de hoje até N dias à frente, das mais próximas
 * para as mais distantes. Sem data não há o que avisar.
 */
export function provasProximas<T extends TemData>(
  hojeIso: string,
  avaliacoes: readonly T[],
  dias = 14,
): T[] {
  const limite = somarDias(hojeIso, dias);
  return avaliacoes
    .filter((a) => a.date !== null && a.date >= hojeIso && a.date <= limite)
    .sort((a, b) => a.date!.localeCompare(b.date!));
}

/** Quantos dias faltam para uma data — 0 é hoje, 1 é amanhã. */
export function diasAte(hojeIso: string, dataIso: string): number {
  const dia = 24 * 60 * 60 * 1000;
  const paraMs = (iso: string) => {
    const [a = 0, m = 1, d = 1] = iso.split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((paraMs(dataIso) - paraMs(hojeIso)) / dia);
}

export { diaDaSemana };
