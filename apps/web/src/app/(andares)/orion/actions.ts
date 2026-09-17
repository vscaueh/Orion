"use server";

import { revalidatePath } from "next/cache";
import type { ActionContext } from "@orion/core";
import { aprovar, rejeitar, responder } from "@orion/orion";
import { provider } from "@/lib/orion";
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
  revalidatePath("/orion");
  revalidatePath("/");
}

export async function conversarAction(formData: FormData): Promise<void> {
  const mensagem = texto(formData, "mensagem");
  if (!mensagem) return;

  await responder({
    ctx: await contexto(),
    provider: provider(),
    texto: mensagem,
    canal: "web",
  });
  atualizar();
}

export async function aprovarPropostaAction(formData: FormData): Promise<void> {
  await aprovar(await contexto(), texto(formData, "id"));
  atualizar();
  // A ação aprovada mexe em algum andar; o mais simples é revalidar tudo.
  revalidatePath("/faculdade");
  revalidatePath("/rotina");
  revalidatePath("/projetos");
}

export async function rejeitarPropostaAction(formData: FormData): Promise<void> {
  await rejeitar(await contexto(), texto(formData, "id"));
  atualizar();
}
