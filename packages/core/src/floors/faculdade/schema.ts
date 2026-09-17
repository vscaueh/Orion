import { z } from "zod";
import type { BaseRow } from "../../types";

// Datas viajam como string ISO (YYYY-MM-DD), igual ao Postgres.

export const semesterInputSchema = z.object({
  name: z.string().min(1, "O semestre precisa de um nome (ex.: 2026.2)"),
  starts_on: z.iso.date(),
  ends_on: z.iso.date(),
  active: z.boolean().default(true),
});
export type SemesterInput = z.input<typeof semesterInputSchema>;

export interface Semester extends BaseRow {
  name: string;
  starts_on: string;
  ends_on: string;
  active: boolean;
}

export const courseInputSchema = z.object({
  semester_id: z.uuid(),
  name: z.string().min(1, "A cadeira precisa de um nome"),
  code: z.string().nullish(),
  professor: z.string().nullish(),
  color: z.string().nullish(),
  /** Carga horária em horas-aula (ex.: 64) — base do limite de faltas. */
  total_hours: z.number().int().positive().nullish(),
});
export type CourseInput = z.input<typeof courseInputSchema>;

export interface Course extends BaseRow {
  semester_id: string;
  name: string;
  code: string | null;
  professor: string | null;
  color: string | null;
  total_hours: number | null;
}

const horaSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora inválida — use HH:MM");

export const classSlotInputSchema = z
  .object({
    course_id: z.uuid(),
    /** 0 = domingo … 6 = sábado, igual ao getDay() do JavaScript. */
    weekday: z.number().int().min(0).max(6),
    starts_at: horaSchema,
    ends_at: horaSchema,
    location: z.string().nullish(),
  })
  .refine((s) => s.ends_at > s.starts_at, {
    message: "A aula precisa terminar depois de começar",
    path: ["ends_at"],
  });
export type ClassSlotInput = z.input<typeof classSlotInputSchema>;

export interface ClassSlot extends BaseRow {
  course_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  location: string | null;
}

export const absenceInputSchema = z.object({
  course_id: z.uuid(),
  date: z.iso.date(),
  justified: z.boolean().default(false),
});
export type AbsenceInput = z.input<typeof absenceInputSchema>;

export interface Absence extends BaseRow {
  course_id: string;
  date: string;
  justified: boolean;
}
