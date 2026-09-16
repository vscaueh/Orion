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
  absence_limit: z.number().int().positive().nullish(),
});
export type CourseInput = z.input<typeof courseInputSchema>;

export interface Course extends BaseRow {
  semester_id: string;
  name: string;
  code: string | null;
  professor: string | null;
  color: string | null;
  absence_limit: number | null;
}
