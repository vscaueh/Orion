import type { ActionContext } from "./action";
import { FUSO_PADRAO } from "./tempo";

// Configurações do usuário. A tabela settings existe desde a Fase 0;
// aqui ela ganha uso: horários das rotinas, fuso e limites.

export interface Configuracoes {
  fuso: string;
  /** Faixa aproveitável do dia, em minutos desde a meia-noite. */
  diaComeca: number;
  diaTermina: number;
  /** Teto de foco por dia para o encaixe de tarefas. */
  maxFocoMin: number;
  /** Para onde as rotinas mandam mensagem. */
  canalPadrao: "telegram" | "web";
}

export const PADROES: Configuracoes = {
  fuso: FUSO_PADRAO,
  diaComeca: 7 * 60,
  diaTermina: 23 * 60,
  maxFocoMin: 4 * 60,
  canalPadrao: "telegram",
};

/**
 * Lê as configurações, caindo nos padrões para o que não estiver
 * gravado. Um valor faltando nunca deve impedir uma rotina de rodar.
 */
export async function lerConfiguracoes({
  supabase,
  userId,
}: ActionContext): Promise<Configuracoes> {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .eq("user_id", userId)
    .returns<{ key: string; value: unknown }[]>();

  if (error) return PADROES;

  const gravado = new Map(data.map((linha) => [linha.key, linha.value]));
  const numero = (chave: string, padrao: number) => {
    const valor = gravado.get(chave);
    return typeof valor === "number" ? valor : padrao;
  };
  const texto = <T extends string>(chave: string, padrao: T): T => {
    const valor = gravado.get(chave);
    return typeof valor === "string" ? (valor as T) : padrao;
  };

  return {
    fuso: texto("fuso", PADROES.fuso),
    diaComeca: numero("dia_comeca", PADROES.diaComeca),
    diaTermina: numero("dia_termina", PADROES.diaTermina),
    maxFocoMin: numero("max_foco_min", PADROES.maxFocoMin),
    canalPadrao: texto("canal_padrao", PADROES.canalPadrao),
  };
}

export async function gravarConfiguracao(
  { supabase, userId }: ActionContext,
  chave: string,
  valor: unknown,
): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: userId, key: chave, value: valor }, { onConflict: "user_id,key" });
  if (error) throw new Error(`Erro ao gravar configuração: ${error.message}`);
}
