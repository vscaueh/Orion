import type { ActionContext } from "@orion/core";
import type { Message } from "./types";

/** Por onde a conversa entrou. O canal em si mora em channels/. */
export type NomeDoCanal = "web" | "telegram";

interface LinhaDeMensagem {
  role: Message["role"];
  content: string;
  tool_calls: Message["toolCalls"] | null;
  tool_call_id: string | null;
}

/** A conversa aberta do canal, ou uma nova. Uma por canal, contínua. */
export async function conversaAtual(
  { supabase, userId }: ActionContext,
  canal: NomeDoCanal,
): Promise<string> {
  const { data: existente, error: erroBusca } = await supabase
    .from("orion_conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("channel", canal)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (erroBusca) throw new Error(`Erro ao abrir conversa: ${erroBusca.message}`);
  if (existente) return existente.id;

  const { data, error } = await supabase
    .from("orion_conversations")
    .insert({ user_id: userId, channel: canal })
    .select("id")
    .single<{ id: string }>();
  if (error) throw new Error(`Erro ao criar conversa: ${error.message}`);
  return data.id;
}

/**
 * As últimas mensagens, em ordem cronológica. O limite existe para o
 * contexto não crescer sem fim — memória é o que guarda o que importa
 * a longo prazo, não o histórico.
 */
export async function historico(
  { supabase, userId }: ActionContext,
  conversaId: string,
  limite = 30,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("orion_messages")
    .select("role, content, tool_calls, tool_call_id")
    .eq("user_id", userId)
    .eq("conversation_id", conversaId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limite)
    .returns<LinhaDeMensagem[]>();
  if (error) throw new Error(`Erro ao ler histórico: ${error.message}`);

  return data.reverse().map((linha) => ({
    role: linha.role,
    content: linha.content,
    ...(linha.tool_calls ? { toolCalls: linha.tool_calls } : {}),
    ...(linha.tool_call_id ? { toolCallId: linha.tool_call_id } : {}),
  }));
}

export async function salvarMensagens(
  { supabase, userId }: ActionContext,
  conversaId: string,
  mensagens: readonly Message[],
): Promise<void> {
  if (mensagens.length === 0) return;
  const { error } = await supabase.from("orion_messages").insert(
    mensagens.map((m) => ({
      user_id: userId,
      conversation_id: conversaId,
      role: m.role,
      content: m.content,
      tool_calls: m.toolCalls ?? null,
      tool_call_id: m.toolCallId ?? null,
    })),
  );
  if (error) throw new Error(`Erro ao salvar mensagens: ${error.message}`);
}
