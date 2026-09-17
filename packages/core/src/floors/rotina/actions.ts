import { defineAction, type ActionContext } from "../../action";
import {
  habitInputSchema,
  habitLogInputSchema,
  habitUpdateSchema,
  type Habit,
  type HabitLog,
} from "./schema";
import { z } from "zod";

const idSchema = z.object({ id: z.uuid() });

export const criarHabito = defineAction({
  name: "rotina.criar_habito",
  description:
    "Cria um hábito com nome, os dias da semana em que vale (0 = domingo) e um horário sugerido opcional.",
  input: habitInputSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, input) {
    const { data, error } = await supabase
      .from("habits")
      .insert({ ...input, user_id: userId })
      .select()
      .single<Habit>();
    if (error) throw new Error(`Erro ao criar hábito: ${error.message}`);
    return data;
  },
});

export const editarHabito = defineAction({
  name: "rotina.editar_habito",
  description: "Altera o nome, os dias ou o horário sugerido de um hábito.",
  input: habitUpdateSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, { id, ...campos }) {
    const { data, error } = await supabase
      .from("habits")
      .update(campos)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single<Habit>();
    if (error) throw new Error(`Erro ao editar hábito: ${error.message}`);
    return data;
  },
});

// Marcar um hábito é o caso típico de auto_ok da seção 6 do CLAUDE.md:
// quando o usuário diz que fez, não há o que aprovar.
export const marcarHabito = defineAction({
  name: "rotina.marcar_habito",
  description:
    "Marca ou desmarca um hábito como feito numa data. Marcar de novo no mesmo dia atualiza em vez de duplicar.",
  input: habitLogInputSchema,
  mutation: true,
  requiresApproval: false,
  async execute({ supabase, userId }, input) {
    const { data, error } = await supabase
      .from("habit_logs")
      .upsert({ ...input, user_id: userId }, { onConflict: "habit_id,date" })
      .select()
      .single<HabitLog>();
    if (error) throw new Error(`Erro ao marcar hábito: ${error.message}`);
    return data;
  },
});

export const arquivarHabito = defineAction({
  name: "rotina.arquivar_habito",
  description:
    "Arquiva um hábito. O histórico fica no banco — o hábito só some das telas.",
  input: idSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }: ActionContext, { id }) {
    const { error } = await supabase
      .from("habits")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Erro ao arquivar hábito: ${error.message}`);
  },
});
