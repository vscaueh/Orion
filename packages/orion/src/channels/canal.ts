// Um canal é por onde a Orion fala e ouve. A interface é a mesma para
// todos, então nada acima dela precisa saber se a conversa veio do
// site, do Telegram ou (um dia) do WhatsApp.

export interface Botao {
  texto: string;
  /** Devolvido ao handler quando o usuário toca. */
  dado: string;
}

export interface OpcoesDeEnvio {
  /** Botões de ação — usados pelas propostas: aprovar e rejeitar. */
  botoes?: Botao[][];
}

export interface Canal {
  readonly nome: "web" | "telegram" | "whatsapp";
  send(userId: string, mensagem: string, opcoes?: OpcoesDeEnvio): Promise<void>;
}

/** Botões de aprovar/rejeitar de uma proposta, iguais em todo canal. */
export function botoesDaProposta(propostaId: string): Botao[][] {
  return [
    [
      { texto: "✓ Aprovar", dado: `aprovar:${propostaId}` },
      { texto: "✗ Rejeitar", dado: `rejeitar:${propostaId}` },
    ],
  ];
}
