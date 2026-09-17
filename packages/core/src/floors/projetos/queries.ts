import type { ActionContext } from "../../action";
import type { Project, ProjectTask } from "./schema";

export async function listarProjetos(ctx: ActionContext): Promise<Project[]> {
  const { data, error } = await ctx.supabase
    .from("projects")
    .select("*")
    .is("archived_at", null)
    .order("status")
    .order("due_on", { nullsFirst: false })
    .order("name")
    .returns<Project[]>();
  if (error) throw new Error(`Erro ao listar projetos: ${error.message}`);
  return data;
}

export async function listarTarefas(
  ctx: ActionContext,
  projectIds?: readonly string[],
): Promise<ProjectTask[]> {
  let query = ctx.supabase
    .from("project_tasks")
    .select("*")
    .is("archived_at", null);

  if (projectIds) {
    if (projectIds.length === 0) return [];
    query = query.in("project_id", projectIds);
  }

  const { data, error } = await query
    .order("due_on", { nullsFirst: false })
    .order("priority")
    .returns<ProjectTask[]>();
  if (error) throw new Error(`Erro ao listar tarefas: ${error.message}`);
  return data;
}
