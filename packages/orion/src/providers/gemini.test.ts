import { describe, expect, it, vi } from "vitest";
import { GeminiProvider } from "./gemini";

function resposta(status: number, corpo: unknown, cabecalhos?: HeadersInit) {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos });
}

const OK = {
  candidates: [{ content: { parts: [{ text: "Bom dia, Motta." }] } }],
};

function provider(
  respostas: Response[],
  opcoes: { tentativas?: number } = {},
) {
  const esperas: number[] = [];
  let i = 0;
  const fetchFalso = vi.fn(async () => respostas[Math.min(i++, respostas.length - 1)]!);

  const p = new GeminiProvider({
    apiKey: "chave",
    fetchImpl: fetchFalso as unknown as typeof fetch,
    esperar: async (ms) => {
      esperas.push(ms);
    },
    ...opcoes,
  });

  return { p, fetchFalso, esperas };
}

const entrada = { system: "s", messages: [{ role: "user" as const, content: "oi" }] };

describe("GeminiProvider", () => {
  it("devolve o texto quando dá certo de primeira", async () => {
    const { p, fetchFalso } = provider([resposta(200, OK)]);
    const r = await p.complete(entrada);

    expect(r.text).toBe("Bom dia, Motta.");
    expect(fetchFalso).toHaveBeenCalledOnce();
  });

  it("insiste quando o modelo está sobrecarregado", async () => {
    const { p, fetchFalso, esperas } = provider([
      resposta(503, { error: "ocupado" }),
      resposta(200, OK),
    ]);

    const r = await p.complete(entrada);
    expect(r.text).toBe("Bom dia, Motta.");
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(esperas).toHaveLength(1);
  });

  it("espera mais a cada tentativa", async () => {
    const { p, esperas } = provider([resposta(503, {})], { tentativas: 3 });
    await expect(p.complete(entrada)).rejects.toThrow();
    expect(esperas).toEqual([1000, 2000]);
  });

  it("respeita o retry-after quando o servidor manda", async () => {
    const { p, esperas } = provider([
      resposta(429, {}, { "retry-after": "7" }),
      resposta(200, OK),
    ]);

    await p.complete(entrada);
    expect(esperas).toEqual([7000]);
  });

  it("não insiste em erro que não passa sozinho", async () => {
    const { p, fetchFalso } = provider([resposta(404, { error: "sem modelo" })]);

    await expect(p.complete(entrada)).rejects.toThrow(/GEMINI_MODEL/);
    expect(fetchFalso).toHaveBeenCalledOnce();
  });

  it("chave recusada vira mensagem sobre a chave", async () => {
    const { p } = provider([resposta(403, {})]);
    await expect(p.complete(entrada)).rejects.toThrow(/GEMINI_API_KEY/);
  });

  it("cota estourada explica o limite do free tier", async () => {
    const { p } = provider([resposta(429, {})], { tentativas: 1 });
    await expect(p.complete(entrada)).rejects.toThrow(/free tier/);
  });

  it("desiste com mensagem legível depois das tentativas", async () => {
    const { p, fetchFalso } = provider([resposta(503, {})], { tentativas: 3 });

    await expect(p.complete(entrada)).rejects.toThrow(/sobrecarregado/);
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });
});
