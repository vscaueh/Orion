import { defineAction } from "../../action";
import {
  classSlotInputSchema,
  courseInputSchema,
  semesterInputSchema,
  type ClassSlot,
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

export const criarHorario = defineAction({
  name: "faculdade.criar_horario",
  description:
    "Adiciona um horário de aula a uma cadeira: dia da semana (0 = domingo), hora de início, hora de fim e local.",
  input: classSlotInputSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, input) {
    const { data, error } = await supabase
      .from("class_slots")
      .insert({ ...input, user_id: userId })
      .select()
      .single<ClassSlot>();
    if (error) throw new Error(`Erro ao criar horário: ${error.message}`);

    // A semana-tipo (andar Rotina) espelha as aulas: o bloco nasce
    // ligado ao slot, então some junto se a aula for removida e nunca
    // precisa ser mantido à mão.
    const { error: erroBloco } = await supabase.from("time_blocks").insert({
      user_id: userId,
      type: "aula",
      weekday: input.weekday,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      source: "generated",
      class_slot_id: data.id,
    });
    if (erroBloco) {
      throw new Error(`Erro ao gerar bloco da semana: ${erroBloco.message}`);
    }

    return data;
  },
});
