// Contratos da camada de IA. Nada aqui conhece um modelo específico —
// trocar de modelo é trocar uma implementação de LLMProvider.

export interface ToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

export interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  /** Presente quando o modelo pediu tools neste turno. */
  toolCalls?: ToolCall[];
  /** Presente quando a mensagem é o resultado de uma tool. */
  toolCallId?: string;
  toolName?: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  /** JSON Schema da entrada, derivado do schema zod da action. */
  parameters: Record<string, unknown>;
}

export interface LLMResult {
  /** Texto da resposta, ou null quando o modelo só pediu tools. */
  text: string | null;
  toolCalls: ToolCall[];
}

export interface LLMInput {
  system: string;
  messages: Message[];
  tools?: ToolSpec[];
}

export interface LLMProvider {
  complete(input: LLMInput): Promise<LLMResult>;
}
