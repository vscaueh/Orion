import { describe, expect, it } from "vitest";
import type { ActionContext } from "@orion/core";
import { MAX_ITERACOES, rodarTurno } from "./loop";
import type { LLMProvider, LLMResult, Message } from "./types";

// Provider falso: devolve respostas roteirizadas, então dá para testar
// o agente inteiro — incluindo o loop de ferramentas — sem rede.
function providerFalso(roteiro: LLMResult[]): LLMProvider & { chamadas: number } {
  let indice = 0;
  return {
    chamadas: 0,
    async complete() {
      this.chamadas++;
      return roteiro[Math.min(indice++, roteiro.length - 1)]!;
    },
  };
}

const texto = (t: string): LLMResult => ({ text: t, toolCalls: [] });
const pedeTool = (name: string, args: unknown): LLMResult => ({
  text: null,
  toolCalls: [{ id: "1", name, arguments: args }],
});

// As actions que viram proposta não tocam no banco, então um contexto
// de mentira basta para estes testes.
const ctx = {} as ActionContext;
const historico: Message[] = [{ role: "user", content: "oi" }];

describe("rodarTurno", () => {
  it("resposta direta encerra o turno numa iteração", async () => {
    const provider = providerFalso([texto("Bom dia, Motta.")]);
    const r = await rodarTurno({
      provider,
      ctx,
      system: "s",
      historico,
    });

    expect(r.resposta).toBe("Bom dia, Motta.");
    expect(r.iteracoes).toBe(1);
    expect(r.propostas).toEqual([]);
  });

  it("ação que exige aprovação vira proposta e não executa", async () => {
    const provider = providerFalso([
      pedeTool("projetos__criar_projeto", {
        name: "Site do cliente",
        type: "freela",
      }),
      texto("Criei a proposta, é só aprovar."),
    ]);

    const r = await rodarTurno({ provider, ctx, system: "s", historico });

    expect(r.propostas).toHaveLength(1);
    expect(r.propostas[0]!.action).toBe("projetos.criar_projeto");
    // O modelo precisa saber que ficou pendente, não que está feito.
    const resultadoDaTool = r.novasMensagens.find((m) => m.role === "tool");
    expect(resultadoDaTool!.content).toContain("aguardando aprovação");
  });

  it("entrada inválida volta ao modelo como erro, sem virar proposta", async () => {
    const provider = providerFalso([
      pedeTool("projetos__criar_projeto", { type: "inexistente" }),
      texto("Faltou o nome do projeto."),
    ]);

    const r = await rodarTurno({ provider, ctx, system: "s", historico });

    expect(r.propostas).toEqual([]);
    const resultadoDaTool = r.novasMensagens.find((m) => m.role === "tool");
    expect(resultadoDaTool!.content).toContain("Entrada inválida");
  });

  it("ferramenta desconhecida não derruba o turno", async () => {
    const provider = providerFalso([
      pedeTool("andar__inexistente", {}),
      texto("Essa eu não sei fazer."),
    ]);

    const r = await rodarTurno({ provider, ctx, system: "s", historico });
    expect(r.resposta).toBe("Essa eu não sei fazer.");
  });

  it("modelo preso em ferramentas para no teto de iterações", async () => {
    const provider = providerFalso([
      pedeTool("projetos__criar_projeto", { name: "X", type: "freela" }),
    ]);

    const r = await rodarTurno({ provider, ctx, system: "s", historico });

    expect(r.iteracoes).toBe(MAX_ITERACOES);
    expect(provider.chamadas).toBe(MAX_ITERACOES);
    expect(r.resposta).toContain("Me enrolei");
  });
});
