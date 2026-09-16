"use server";

import { revalidatePath } from "next/cache";
import { faculdade, runAction, type ActionContext } from "@orion/core";
import { createClient } from "@/lib/supabase/server";

// Server Actions: a ponte entre os <form> e as actions do core.
// Aqui só se monta o contexto e se traduz FormData; regra de negócio
// e validação vivem no core.

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

export async function criarSemestreAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(faculdade.criarSemestre, ctx, {
    name: texto(formData, "name"),
    starts_on: texto(formData, "starts_on"),
    ends_on: texto(formData, "ends_on"),
    active: true,
  });
  revalidatePath("/faculdade");
}

export async function criarCadeiraAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  const limite = texto(formData, "absence_limit");
  await runAction(faculdade.criarCadeira, ctx, {
    semester_id: texto(formData, "semester_id"),
    name: texto(formData, "name"),
    code: texto(formData, "code") || null,
    professor: texto(formData, "professor") || null,
    absence_limit: limite ? Number(limite) : null,
  });
  revalidatePath("/faculdade");
}
