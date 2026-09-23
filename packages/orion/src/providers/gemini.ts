import type {
  LLMInput,
  LLMProvider,
  LLMResult,
  Message,
  ToolCall,
} from "../types";

// Única porta de entrada para um modelo. O acesso é por HTTP direto,
// sem SDK: a superfície que usamos é pequena e assim o pacote não
// ganha uma dependência que amarra o projeto a um fornecedor.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

interface ParteGemini {
  text?: string;
  functionCall?: { name: string; args: unknown };
  functionResponse?: { name: string; response: unknown };
}

interface ConteudoGemini {
  role: "user" | "model";
  parts: ParteGemini[];
}

export interface GeminiOptions {
  apiKey: string;
  /**
   * Ex.: "gemini-3.6-flash". O Google aposenta modelos para contas
   * novas de tempos em tempos, então isto é configurável de fora: a
   * troca é uma variável de ambiente, não um deploy.
   */
  model?: string;
  fetchImpl?: typeof fetch;
}

export class GeminiProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor({ apiKey, model = "gemini-3.6-flash", fetchImpl }: GeminiOptions) {
    if (!apiKey) throw new Error("GeminiProvider precisa de uma apiKey.");
    this.apiKey = apiKey;
    this.model = model;
    this.fetchImpl = fetchImpl ?? globalThis.fetch;
  }

  async complete(input: LLMInput): Promise<LLMResult> {
    const corpo = {
      systemInstruction: { parts: [{ text: input.system }] },
      contents: paraConteudos(input.messages),
      ...(input.tools?.length
        ? {
            tools: [
              {
                functionDeclarations: input.tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  parameters: t.parameters,
                })),
              },
            ],
          }
        : {}),
    };

    const resposta = await this.fetchImpl(
      `${ENDPOINT}/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(corpo),
      },
    );

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      throw new Error(
        `Gemini respondeu ${resposta.status}: ${detalhe.slice(0, 300)}`,
      );
    }

    const json = (await resposta.json()) as {
      candidates?: { content?: { parts?: ParteGemini[] } }[];
    };
    return extrairResultado(json.candidates?.[0]?.content?.parts ?? []);
  }
}

/**
 * O Gemini não tem papel "tool": o resultado de uma ferramenta volta
 * como uma parte functionResponse numa mensagem do usuário. Mensagens
 * consecutivas do mesmo papel também precisam ser agrupadas.
 */
function paraConteudos(messages: readonly Message[]): ConteudoGemini[] {
  const conteudos: ConteudoGemini[] = [];

  for (const mensagem of messages) {
    const papel: "user" | "model" =
      mensagem.role === "assistant" ? "model" : "user";

    const partes: ParteGemini[] = [];
    if (mensagem.role === "tool") {
      partes.push({
        functionResponse: {
          name: mensagem.toolName ?? "desconhecida",
          response: { resultado: mensagem.content },
        },
      });
    } else {
      if (mensagem.content) partes.push({ text: mensagem.content });
      for (const chamada of mensagem.toolCalls ?? []) {
        partes.push({
          functionCall: { name: chamada.name, args: chamada.arguments },
        });
      }
    }
    if (partes.length === 0) continue;

    const ultimo = conteudos[conteudos.length - 1];
    if (ultimo && ultimo.role === papel) {
      ultimo.parts.push(...partes);
    } else {
      conteudos.push({ role: papel, parts: partes });
    }
  }

  return conteudos;
}

function extrairResultado(partes: readonly ParteGemini[]): LLMResult {
  const textos: string[] = [];
  const toolCalls: ToolCall[] = [];

  for (const [indice, parte] of partes.entries()) {
    if (parte.text) textos.push(parte.text);
    if (parte.functionCall) {
      toolCalls.push({
        // O Gemini não devolve id de chamada; um identificador local
        // basta para casar a chamada com o resultado.
        id: `${parte.functionCall.name}-${indice}`,
        name: parte.functionCall.name,
        arguments: parte.functionCall.args ?? {},
      });
    }
  }

  return { text: textos.join("\n").trim() || null, toolCalls };
}
