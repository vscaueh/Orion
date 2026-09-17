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
  const carga = texto(formData, "total_hours");
  await runAction(faculdade.criarCadeira, ctx, {
    semester_id: texto(formData, "semester_id"),
    name: texto(formData, "name"),
    code: texto(formData, "code") || null,
    professor: texto(formData, "professor") || null,
    total_hours: carga ? Number(carga) : null,
  });
  revalidatePath("/faculdade");
}

export async function criarHorarioAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(faculdade.criarHorario, ctx, {
    course_id: texto(formData, "course_id"),
    weekday: Number(texto(formData, "weekday")),
    starts_at: texto(formData, "starts_at"),
    ends_at: texto(formData, "ends_at"),
    location: texto(formData, "location") || null,
  });
  revalidatePath("/faculdade");
}

export async function registrarFaltaAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(faculdade.registrarFalta, ctx, {
    course_id: texto(formData, "course_id"),
    date: texto(formData, "date"),
    justified: formData.get("justified") === "on",
  });
  revalidatePath("/faculdade");
}

export async function editarCadeiraAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  const carga = texto(formData, "total_hours");
  await runAction(faculdade.editarCadeira, ctx, {
    id: texto(formData, "id"),
    name: texto(formData, "name"),
    code: texto(formData, "code") || null,
    professor: texto(formData, "professor") || null,
    total_hours: carga ? Number(carga) : null,
  });
  revalidatePath("/faculdade");
}

export async function arquivarCadeiraAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(faculdade.arquivarCadeira, ctx, { id: texto(formData, "id") });
  revalidatePath("/faculdade");
}

export async function arquivarHorarioAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(faculdade.arquivarHorario, ctx, { id: texto(formData, "id") });
  revalidatePath("/faculdade");
}

export async function arquivarFaltaAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(faculdade.arquivarFalta, ctx, { id: texto(formData, "id") });
  revalidatePath("/faculdade");
}
