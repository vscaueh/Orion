export type { BaseRow, FloorId } from "./types";
export type { Floor } from "./floors";
export { FLOORS } from "./floors";

export type { Action, ActionContext } from "./action";
export { defineAction, runAction } from "./action";

export * as faculdade from "./floors/faculdade";
export * as hoje from "./floors/hoje";
export * as projetos from "./floors/projetos";
export * as rotina from "./floors/rotina";
export {
  agoraNoFuso,
  diaDaSemana,
  periodoDoDia,
  somarDias,
  FUSO_PADRAO,
} from "./tempo";
export type { Agora, PeriodoDoDia } from "./tempo";
export * from "./settings";
