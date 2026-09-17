"use server";

import { revalidatePath } from "next/cache";
import { rotina, runAction, type ActionContext } from "@orion/core";
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

/** Os dias chegam como uma caixa de seleção por dia da semana. */
function dias(formData: FormData): number[] {
  return formData.getAll("weekdays").map((d) => Number(d));
}

export async function criarHabitoAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(rotina.criarHabito, ctx, {
    name: texto(formData, "name"),
    weekdays: dias(formData),
    suggested_time: texto(formData, "suggested_time") || null,
  });
  revalidatePath("/rotina");
  revalidatePath("/");
}

export async function editarHabitoAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(rotina.editarHabito, ctx, {
    id: texto(formData, "id"),
    name: texto(formData, "name"),
    weekdays: dias(formData),
    suggested_time: texto(formData, "suggested_time") || null,
  });
  revalidatePath("/rotina");
  revalidatePath("/");
}

export async function marcarHabitoAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(rotina.marcarHabito, ctx, {
    habit_id: texto(formData, "habit_id"),
    date: texto(formData, "date"),
    // O botão manda o estado desejado, não um toggle: assim dois
    // cliques rápidos não se cancelam por corrida.
    done: texto(formData, "done") === "1",
  });
  revalidatePath("/rotina");
  revalidatePath("/");
}

export async function arquivarHabitoAction(formData: FormData): Promise<void> {
  const ctx = await contexto();
  await runAction(rotina.arquivarHabito, ctx, { id: texto(formData, "id") });
  revalidatePath("/rotina");
  revalidatePath("/");
}
