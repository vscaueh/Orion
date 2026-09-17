import { diaDaSemana, somarDias } from "../../tempo";

/** Teto de dias a percorrer — um hábito de dois anos já é história. */
const LIMITE_BUSCA = 730;

/**
 * Quantos dias seguidos o hábito vem sendo cumprido, contando para trás
 * a partir de hoje e olhando só os dias em que ele vale.
 *
 * O dia de hoje não quebra a sequência quando ainda não foi marcado —
 * o dia não acabou. Um dia anterior em branco, sim.
 */
export function streak(
  hojeIso: string,
  diasDoHabito: readonly number[],
  feitos: ReadonlySet<string>,
): number {
  const vale = new Set(diasDoHabito);
  let total = 0;

  for (let atras = 0; atras < LIMITE_BUSCA; atras++) {
    const dia = somarDias(hojeIso, -atras);
    if (!vale.has(diaDaSemana(dia))) continue;

    if (feitos.has(dia)) {
      total++;
      continue;
    }
    if (atras === 0) continue; // hoje ainda está em aberto
    break;
  }

  return total;
}

/** O hábito vale hoje? */
export function valeHoje(
  hojeIso: string,
  diasDoHabito: readonly number[],
): boolean {
  return diasDoHabito.includes(diaDaSemana(hojeIso));
}
