// Colunas presentes em toda tabela do Orion (ver CLAUDE.md, seção 5).
// archived_at nulo = registro ativo; preenchido = mora no Arquivo.
export interface BaseRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export type FloorId =
  | "hoje"
  | "faculdade"
  | "estudo"
  | "projetos"
  | "rotina"
  | "compras"
  | "skincare"
  | "metas"
  | "arquivo"
  | "orion";
