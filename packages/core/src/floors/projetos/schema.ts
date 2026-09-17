import { z } from "zod";
import type { BaseRow } from "../../types";

export const TIPOS_DE_PROJETO = [
  "freela",
  "pessoal",
  "portfolio",
  "candidatura",
] as const;
export const STATUS_DE_PROJETO = ["ativo", "pausado", "concluido"] as const;
export const PRIORIDADES = ["alta", "media", "baixa"] as const;

export type TipoDeProjeto = (typeof TIPOS_DE_PROJETO)[number];
export type StatusDeProjeto = (typeof STATUS_DE_PROJETO)[number];
export type Prioridade = (typeof PRIORIDADES)[number];

export const projectInputSchema = z.object({
  name: z.string().min(1, "O projeto precisa de um nome"),
  type: z.enum(TIPOS_DE_PROJETO),
  next_step: z.string().nullish(),
  client: z.string().nullish(),
  due_on: z.iso.date().nullish(),
  repo_url: z.url().nullish().or(z.literal("")),
  deploy_url: z.url().nullish().or(z.literal("")),
});
export type ProjectInput = z.input<typeof projectInputSchema>;

export const projectUpdateSchema = projectInputSchema.extend({
  id: z.uuid(),
  status: z.enum(STATUS_DE_PROJETO),
});

export const taskInputSchema = z.object({
  project_id: z.uuid(),
  title: z.string().min(1, "A tarefa precisa de um título"),
  estimated_minutes: z.number().int().positive().nullish(),
  priority: z.enum(PRIORIDADES).default("media"),
  due_on: z.iso.date().nullish(),
});
export type TaskInput = z.input<typeof taskInputSchema>;

export const idSchema = z.object({ id: z.uuid() });
export const concluirSchema = z.object({
  id: z.uuid(),
  concluida: z.boolean(),
});

export interface Project extends BaseRow {
  name: string;
  type: TipoDeProjeto;
  status: StatusDeProjeto;
  next_step: string | null;
  client: string | null;
  due_on: string | null;
  repo_url: string | null;
  deploy_url: string | null;
}

export interface ProjectTask extends BaseRow {
  project_id: string;
  title: string;
  estimated_minutes: number | null;
  priority: Prioridade;
  due_on: string | null;
  completed_at: string | null;
}
