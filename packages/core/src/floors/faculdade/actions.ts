import { defineAction } from "../../action";
import {
  courseInputSchema,
  semesterInputSchema,
  type Course,
  type Semester,
} from "./schema";

export const criarSemestre = defineAction({
  name: "faculdade.criar_semestre",
  description:
    "Cria um semestre da faculdade com nome (ex.: 2026.2), data de início e fim.",
  input: semesterInputSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, input) {
    // Só um semestre ativo por vez: ativar um desativa os demais.
    if (input.active) {
      const { error } = await supabase
        .from("semesters")
        .update({ active: false })
        .eq("user_id", userId)
        .eq("active", true);
      if (error) throw new Error(`Erro ao desativar semestres: ${error.message}`);
    }

    const { data, error } = await supabase
      .from("semesters")
      .insert({ ...input, user_id: userId })
      .select()
      .single<Semester>();
    if (error) throw new Error(`Erro ao criar semestre: ${error.message}`);
    return data;
  },
});

export const criarCadeira = defineAction({
  name: "faculdade.criar_cadeira",
  description:
    "Cria uma cadeira (disciplina) em um semestre, com nome e, opcionalmente, código, professor, cor e carga horária em horas-aula.",
  input: courseInputSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, input) {
    const { data, error } = await supabase
      .from("courses")
      .insert({ ...input, user_id: userId })
      .select()
      .single<Course>();
    if (error) throw new Error(`Erro ao criar cadeira: ${error.message}`);
    return data;
  },
});
