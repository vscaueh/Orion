import { defineAction, type ActionContext } from "../../action";
import {
  absenceInputSchema,
  classSlotInputSchema,
  courseInputSchema,
  courseUpdateSchema,
  idSchema,
  semesterInputSchema,
  type Absence,
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

export const registrarFalta = defineAction({
  name: "faculdade.registrar_falta",
  description:
    "Registra uma falta em uma cadeira numa data. O peso em horas-aula vem do horário daquele dia.",
  input: absenceInputSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, input) {
    const { data, error } = await supabase
      .from("absences")
      .insert({ ...input, user_id: userId })
      .select()
      .single<Absence>();
    if (error) throw new Error(`Erro ao registrar falta: ${error.message}`);
    return data;
  },
});

export const editarCadeira = defineAction({
  name: "faculdade.editar_cadeira",
  description:
    "Altera os dados de uma cadeira: nome, código, professor e carga horária.",
  input: courseUpdateSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, { id, ...campos }) {
    const { data, error } = await supabase
      .from("courses")
      .update(campos)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single<Course>();
    if (error) throw new Error(`Erro ao editar cadeira: ${error.message}`);
    return data;
  },
});

// Arquivar em vez de apagar: o dado sai das telas (toda query filtra
// archived_at null) mas continua no banco, alimentando o andar Arquivo.
async function arquivar(
  { supabase, userId }: ActionContext,
  tabela: string,
  coluna: string,
  valor: string | readonly string[],
): Promise<void> {
  const query = supabase
    .from(tabela)
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("archived_at", null);

  const { error } = Array.isArray(valor)
    ? await query.in(coluna, valor as string[])
    : await query.eq(coluna, valor as string);
  if (error) throw new Error(`Erro ao arquivar em ${tabela}: ${error.message}`);
}

export const arquivarCadeira = defineAction({
  name: "faculdade.arquivar_cadeira",
  description:
    "Arquiva uma cadeira e o que depende dela (horários e blocos da semana). Nada é apagado — some das telas e vai para o Arquivo.",
  input: idSchema,
  mutation: true,
  requiresApproval: true,
  async execute(ctx, { id }) {
    // Os horários precisam ir junto, senão a semana-tipo do andar
    // Rotina continuaria mostrando aulas de uma cadeira que saiu.
    const { data: slots, error } = await ctx.supabase
      .from("class_slots")
      .select("id")
      .eq("course_id", id)
      .eq("user_id", ctx.userId)
      .returns<{ id: string }[]>();
    if (error) throw new Error(`Erro ao ler horários: ${error.message}`);

    const idsSlots = slots.map((s) => s.id);
    if (idsSlots.length > 0) {
      await arquivar(ctx, "time_blocks", "class_slot_id", idsSlots);
      await arquivar(ctx, "class_slots", "id", idsSlots);
    }
    await arquivar(ctx, "courses", "id", id);
  },
});

export const arquivarHorario = defineAction({
  name: "faculdade.arquivar_horario",
  description:
    "Remove um horário de aula da cadeira, junto com o bloco que ele gerou na semana-tipo.",
  input: idSchema,
  mutation: true,
  requiresApproval: true,
  async execute(ctx, { id }) {
    await arquivar(ctx, "time_blocks", "class_slot_id", id);
    await arquivar(ctx, "class_slots", "id", id);
  },
});

export const arquivarFalta = defineAction({
  name: "faculdade.arquivar_falta",
  description: "Remove uma falta registrada por engano.",
  input: idSchema,
  mutation: true,
  requiresApproval: true,
  async execute(ctx, { id }) {
    await arquivar(ctx, "absences", "id", id);
  },
});
