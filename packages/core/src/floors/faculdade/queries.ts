import type { ActionContext } from "../../action";
import type { ClassSlot, Course, Semester } from "./schema";

// Leituras não são actions (não mutam nada, não precisam de aprovação);
// são funções simples sobre o mesmo contexto.

export async function listarSemestres(
  ctx: ActionContext,
): Promise<Semester[]> {
  const { data, error } = await ctx.supabase
    .from("semesters")
    .select("*")
    .is("archived_at", null)
    .order("starts_on", { ascending: false })
    .returns<Semester[]>();
  if (error) throw new Error(`Erro ao listar semestres: ${error.message}`);
  return data;
}

export async function listarCadeiras(
  ctx: ActionContext,
  semesterId: string,
): Promise<Course[]> {
  const { data, error } = await ctx.supabase
    .from("courses")
    .select("*")
    .eq("semester_id", semesterId)
    .is("archived_at", null)
    .order("name")
    .returns<Course[]>();
  if (error) throw new Error(`Erro ao listar cadeiras: ${error.message}`);
  return data;
}

/** Horários de várias cadeiras de uma vez, na ordem da semana. */
export async function listarHorarios(
  ctx: ActionContext,
  courseIds: readonly string[],
): Promise<ClassSlot[]> {
  if (courseIds.length === 0) return [];
  const { data, error } = await ctx.supabase
    .from("class_slots")
    .select("*")
    .in("course_id", courseIds)
    .is("archived_at", null)
    .order("weekday")
    .order("starts_at")
    .returns<ClassSlot[]>();
  if (error) throw new Error(`Erro ao listar horários: ${error.message}`);
  return data;
}
