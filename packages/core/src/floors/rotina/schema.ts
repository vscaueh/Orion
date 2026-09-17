import { z } from "zod";
import type { BaseRow } from "../../types";

export const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6] as const;

const diaSchema = z.number().int().min(0).max(6);

export const habitInputSchema = z.object({
  name: z.string().min(1, "O hábito precisa de um nome"),
  /** Dias em que o hábito vale. Os sete = diário. */
  weekdays: z.array(diaSchema).min(1, "Escolha ao menos um dia"),
  suggested_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora inválida — use HH:MM")
    .nullish(),
});
export type HabitInput = z.input<typeof habitInputSchema>;

export const habitUpdateSchema = habitInputSchema.extend({ id: z.uuid() });

export const habitLogInputSchema = z.object({
  habit_id: z.uuid(),
  date: z.iso.date(),
  done: z.boolean(),
});

export interface Habit extends BaseRow {
  name: string;
  weekdays: number[];
  suggested_time: string | null;
  active: boolean;
}

export interface HabitLog extends BaseRow {
  habit_id: string;
  date: string;
  done: boolean;
}
