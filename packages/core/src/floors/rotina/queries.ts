import type { ActionContext } from "../../action";
import { somarDias } from "../../tempo";
import type { Habit, HabitLog } from "./schema";

export async function listarHabitos(ctx: ActionContext): Promise<Habit[]> {
  const { data, error } = await ctx.supabase
    .from("habits")
    .select("*")
    .is("archived_at", null)
    .eq("active", true)
    .order("suggested_time", { nullsFirst: false })
    .order("name")
    .returns<Habit[]>();
  if (error) throw new Error(`Erro ao listar hábitos: ${error.message}`);
  return data;
}

/**
 * Registros dos últimos N dias — o bastante para as sequências, sem
 * trazer o histórico inteiro a cada visita ao Hoje.
 */
export async function listarRegistros(
  ctx: ActionContext,
  hojeIso: string,
  dias = 180,
): Promise<HabitLog[]> {
  const { data, error } = await ctx.supabase
    .from("habit_logs")
    .select("*")
    .gte("date", somarDias(hojeIso, -dias))
    .lte("date", hojeIso)
    .eq("done", true)
    .is("archived_at", null)
    .returns<HabitLog[]>();
  if (error) throw new Error(`Erro ao listar registros: ${error.message}`);
  return data;
}
