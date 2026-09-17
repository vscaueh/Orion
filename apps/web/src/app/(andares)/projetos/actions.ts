"use server";

import { revalidatePath } from "next/cache";
import { projetos, runAction, type ActionContext } from "@orion/core";
import { createClient } from "@/lib/supabase/server";

async function contexto(): Promise<ActionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada — entre de novo.");
  return { supabase, userId: user.id };
}

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

function atualizar() {
  revalidatePath("/projetos");
  revalidatePath("/");
}

function camposDoProjeto(formData: FormData) {
  return {
    name: texto(formData, "name"),
    type: texto(formData, "type"),
    next_step: texto(formData, "next_step") || null,
    client: texto(formData, "client") || null,
    due_on: texto(formData, "due_on") || null,
    repo_url: texto(formData, "repo_url") || null,
    deploy_url: texto(formData, "deploy_url") || null,
  };
}

export async function criarProjetoAction(formData: FormData): Promise<void> {
  await runAction(
    projetos.criarProjeto,
    await contexto(),
    camposDoProjeto(formData),
  );
  atualizar();
}

export async function editarProjetoAction(formData: FormData): Promise<void> {
  await runAction(projetos.editarProjeto, await contexto(), {
    id: texto(formData, "id"),
    status: texto(formData, "status"),
    ...camposDoProjeto(formData),
  });
  atualizar();
}

export async function arquivarProjetoAction(formData: FormData): Promise<void> {
  await runAction(projetos.arquivarProjeto, await contexto(), {
    id: texto(formData, "id"),
  });
  atualizar();
}

export async function criarTarefaAction(formData: FormData): Promise<void> {
  const minutos = texto(formData, "estimated_minutes");
  await runAction(projetos.criarTarefa, await contexto(), {
    project_id: texto(formData, "project_id"),
    title: texto(formData, "title"),
    estimated_minutes: minutos ? Number(minutos) : null,
    priority: texto(formData, "priority") || "media",
    due_on: texto(formData, "due_on") || null,
  });
  atualizar();
}

export async function concluirTarefaAction(formData: FormData): Promise<void> {
  await runAction(projetos.concluirTarefa, await contexto(), {
    id: texto(formData, "id"),
    concluida: texto(formData, "concluida") === "1",
  });
  atualizar();
}

export async function arquivarTarefaAction(formData: FormData): Promise<void> {
  await runAction(projetos.arquivarTarefa, await contexto(), {
    id: texto(formData, "id"),
  });
  atualizar();
}
