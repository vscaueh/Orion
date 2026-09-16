// Regras de avaliação da UNIFOR (3 etapas: AV1, AV2, AV3).
//
// 1. Para fazer a AV3: média(AV1, AV2) >= MEDIA_MINIMA_PARA_AV3
// 2. Aprovação: AV3 >= NOTA_MINIMA_AV3 e média(AV1, AV2, AV3) >= MEDIA_FINAL
// 3. Faltas: até LIMITE_FALTAS do total de aulas
//
// Os limiares usam >= ("pelo menos"). Se a regra real for estritamente
// maior, basta trocar as comparações aqui — nada fora deste arquivo
// conhece os números.

export const MEDIA_MINIMA_PARA_AV3 = 4;
export const NOTA_MINIMA_AV3 = 4;
export const MEDIA_FINAL = 5;
export const NOTA_MAXIMA = 10;
export const LIMITE_FALTAS = 0.25;

export function mediaParciais(av1: number, av2: number): number {
  return (av1 + av2) / 2;
}

export function podeFazerAv3(av1: number, av2: number): boolean {
  return mediaParciais(av1, av2) >= MEDIA_MINIMA_PARA_AV3;
}

/**
 * Nota mínima na AV2 para liberar a AV3, dado o resultado da AV1.
 * Sempre alcançável: mesmo com AV1 = 0, bastam 8 na AV2.
 */
export function notaNecessariaAv2(av1: number): number {
  const necessaria = 2 * MEDIA_MINIMA_PARA_AV3 - av1;
  return Math.max(0, necessaria);
}

/**
 * Nota mínima na AV3 para aprovação, dadas AV1 e AV2.
 * Retorna null se a AV3 nem está liberada (média das parciais abaixo
 * do mínimo). Quando liberada, é sempre alcançável: a soma das
 * parciais é >= 8, então nunca é preciso mais que 7.
 */
export function notaNecessariaAv3(av1: number, av2: number): number | null {
  if (!podeFazerAv3(av1, av2)) return null;
  const paraMediaFinal = 3 * MEDIA_FINAL - av1 - av2;
  return Math.max(NOTA_MINIMA_AV3, paraMediaFinal);
}

export function mediaFinal(av1: number, av2: number, av3: number): number {
  return (av1 + av2 + av3) / 3;
}

export function aprovado(av1: number, av2: number, av3: number): boolean {
  return (
    podeFazerAv3(av1, av2) &&
    av3 >= NOTA_MINIMA_AV3 &&
    mediaFinal(av1, av2, av3) >= MEDIA_FINAL
  );
}

/**
 * Quantas faltas ainda cabem no limite de 25%.
 * Negativo = limite estourado.
 */
export function faltasRestantes(
  totalAulas: number,
  faltasDadas: number,
): number {
  return Math.floor(totalAulas * LIMITE_FALTAS) - faltasDadas;
}
