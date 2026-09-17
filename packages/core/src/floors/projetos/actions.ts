import { defineAction } from "../../action";
import {
  concluirSchema,
  idSchema,
  projectInputSchema,
  projectUpdateSchema,
  taskInputSchema,
  type Project,
  type ProjectTask,
} from "./schema";

/** Campos de URL chegam vazios do formulário; o banco prefere null. */
function semVazios<T extends Record<string, unknown>>(campos: T): T {
  const limpo = { ...campos };
  for (const [chave, valor] of Object.entries(limpo)) {
    if (valor === "") (limpo as Record<string, unknown>)[chave] = null;
  }
  return limpo;
}

export const criarProjeto = defineAction({
  name: "projetos.criar_projeto",
  description:
    "Cria um projeto do tipo freela, pessoal, portfólio ou candidatura, com próximo passo, cliente, prazo e links opcionais.",
  input: projectInputSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, input) {
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...semVazios(input), user_id: userId })
      .select()
      .single<Project>();
    if (error) throw new Error(`Erro ao criar projeto: ${error.message}`);
    return data;
  },
});

export const editarProjeto = defineAction({
  name: "projetos.editar_projeto",
  description:
    "Altera um projeto: nome, tipo, status, próximo passo, cliente, prazo e links.",
  input: projectUpdateSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, { id, ...campos }) {
    const { data, error } = await supabase
      .from("projects")
      .update(semVazios(campos))
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single<Project>();
    if (error) throw new Error(`Erro ao editar projeto: ${error.message}`);
    return data;
  },
});

export const arquivarProjeto = defineAction({
  name: "projetos.arquivar_projeto",
  description: "Arquiva um projeto e suas tarefas.",
  input: idSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, { id }) {
    const agora = new Date().toISOString();
    const { error: erroTarefas } = await supabase
      .from("project_tasks")
      .update({ archived_at: agora })
      .eq("project_id", id)
      .eq("user_id", userId)
      .is("archived_at", null);
    if (erroTarefas) {
      throw new Error(`Erro ao arquivar tarefas: ${erroTarefas.message}`);
    }

    const { error } = await supabase
      .from("projects")
      .update({ archived_at: agora })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Erro ao arquivar projeto: ${error.message}`);
  },
});

export const criarTarefa = defineAction({
  name: "projetos.criar_tarefa",
  description:
    "Cria uma tarefa em um projeto, com duração estimada em minutos, prioridade e prazo. A duração é o que permite encaixá-la numa janela livre.",
  input: taskInputSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, input) {
    const { data, error } = await supabase
      .from("project_tasks")
      .insert({ ...input, user_id: userId })
      .select()
      .single<ProjectTask>();
    if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);
    return data;
  },
});

// Concluir o que o usuário disse que fez não precisa de aprovação.
export const concluirTarefa = defineAction({
  name: "projetos.concluir_tarefa",
  description: "Marca uma tarefa como concluída, ou a reabre.",
  input: concluirSchema,
  mutation: true,
  requiresApproval: false,
  async execute({ supabase, userId }, { id, concluida }) {
    const { data, error } = await supabase
      .from("project_tasks")
      .update({ completed_at: concluida ? new Date().toISOString() : null })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single<ProjectTask>();
    if (error) throw new Error(`Erro ao concluir tarefa: ${error.message}`);
    return data;
  },
});

export const arquivarTarefa = defineAction({
  name: "projetos.arquivar_tarefa",
  description: "Remove uma tarefa.",
  input: idSchema,
  mutation: true,
  requiresApproval: true,
  async execute({ supabase, userId }, { id }) {
    const { error } = await supabase
      .from("project_tasks")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Erro ao remover tarefa: ${error.message}`);
  },
});
