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

/**
 * Status que compensa repetir: sobrecarga e limite de cota passam
 * sozinhos. Um 400 ou 404 não passa — repetir só atrasa o erro.
 */
const REPETIVEIS = new Set([429, 500, 502, 503, 504]);

export interface GeminiOptions {
  apiKey: string;
  /**
   * Ex.: "gemini-3.6-flash". O Google aposenta modelos para contas
   * novas de tempos em tempos, então isto é configurável de fora: a
   * troca é uma variável de ambiente, não um deploy.
   */
  model?: string;
  fetchImpl?: typeof fetch;
  /** Quantas vezes tentar no total, contando a primeira. */
  tentativas?: number;
  /** Injetável para os testes não dormirem de verdade. */
  esperar?: (ms: number) => Promise<void>;
}

export class GeminiProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;
  private readonly tentativas: number;
  private readonly esperar: (ms: number) => Promise<void>;

  constructor({
    apiKey,
    model = "gemini-3.6-flash",
    fetchImpl,
    tentativas = 3,
    esperar,
  }: GeminiOptions) {
    if (!apiKey) throw new Error("GeminiProvider precisa de uma apiKey.");
    this.apiKey = apiKey;
    this.model = model;
    this.fetchImpl = fetchImpl ?? globalThis.fetch;
    this.tentativas = Math.max(1, tentativas);
    this.esperar =
      esperar ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
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

    const resposta = await this.pedirComRetentativa(corpo);

    const json = (await resposta.json()) as {
      candidates?: { content?: { parts?: ParteGemini[] } }[];
    };
    return extrairResultado(json.candidates?.[0]?.content?.parts ?? []);
  }

  /**
   * Sobrecarga do modelo e estouro de cota são a rotina do free tier, e
   * passam sozinhos em segundos. Insistir aqui evita transformar um
   * soluço do fornecedor numa conversa perdida.
   */
  private async pedirComRetentativa(corpo: unknown): Promise<Response> {
    for (let tentativa = 1; ; tentativa++) {
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

      if (resposta.ok) return resposta;

      const ultima = tentativa >= this.tentativas;
      if (ultima || !REPETIVEIS.has(resposta.status)) {
        const detalhe = await resposta.text().catch(() => "");
        throw new Error(mensagemDeErro(resposta.status, detalhe));
      }

      // O servidor às vezes diz quanto esperar; senão, dobra a cada vez.
      const pedido = Number(resposta.headers.get("retry-after")) * 1000;
      await this.esperar(
        Number.isFinite(pedido) && pedido > 0 ? pedido : 2 ** tentativa * 500,
      );
    }
  }
}

/** Mensagens que dizem o que fazer, em vez de despejar o JSON do erro. */
function mensagemDeErro(status: number, detalhe: string): string {
  if (status === 429) {
    return (
      "A cota do modelo estourou. O free tier tem limite por minuto e por " +
      "dia — espere um pouco e tente de novo."
    );
  }
  if (status >= 500) {
    return (
      "O modelo está sobrecarregado e não respondeu, mesmo depois de " +
      "algumas tentativas. Costuma passar em instantes."
    );
  }
  if (status === 404) {
    return (
      `O modelo configurado não existe ou não está disponível para esta ` +
      `conta. Troque GEMINI_MODEL. Detalhe: ${detalhe.slice(0, 200)}`
    );
  }
  if (status === 401 || status === 403) {
    return "A chave do modelo foi recusada. Confira GEMINI_API_KEY.";
  }
  return `Gemini respondeu ${status}: ${detalhe.slice(0, 300)}`;
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
