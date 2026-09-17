import { z } from "zod";
import type { ToolSpec } from "./types";

// O modelo aceita um subconjunto do JSON Schema: sem restrições de
// tamanho, sem regex, sem $schema. Mandar o schema cru faz a chamada
// ser recusada, então aqui ele é reduzido ao que passa — e o que se
// perde (formato de data, por exemplo) vira texto na descrição, que o
// modelo lê do mesmo jeito.

const CHAVES_MANTIDAS = new Set([
  "type",
  "description",
  "enum",
  "properties",
  "items",
  "required",
  "nullable",
]);

const DICAS_DE_FORMATO: Record<string, string> = {
  date: "formato YYYY-MM-DD",
  "date-time": "data e hora em ISO 8601",
  uri: "URL completa",
  uuid: "identificador uuid",
};

export function paraSchemaDoModelo(no: unknown): Record<string, unknown> {
  if (typeof no !== "object" || no === null) return {};
  const entrada = no as Record<string, unknown>;

  // Campo opcional vira anyOf com null; o modelo entende melhor um
  // tipo único marcado como nullable.
  if (Array.isArray(entrada.anyOf)) {
    const semNulo = entrada.anyOf.filter(
      (ramo) => (ramo as Record<string, unknown>)?.type !== "null",
    );
    const temNulo = semNulo.length < entrada.anyOf.length;
    const escolhido = paraSchemaDoModelo(semNulo[0] ?? {});
    return temNulo ? { ...escolhido, nullable: true } : escolhido;
  }

  const saida: Record<string, unknown> = {};
  const dicas: string[] = [];

  for (const [chave, valor] of Object.entries(entrada)) {
    // A outra forma de campo opcional: type: ["string", "null"].
    if (chave === "type" && Array.isArray(valor)) {
      const tipos = valor.filter((t) => t !== "null");
      if (tipos.length < valor.length) saida.nullable = true;
      saida.type = tipos[0] ?? "string";
      continue;
    }

    if (chave === "format" && typeof valor === "string") {
      const dica = DICAS_DE_FORMATO[valor];
      if (dica) dicas.push(dica);
      continue;
    }
    if (!CHAVES_MANTIDAS.has(chave)) continue;

    if (chave === "properties" && typeof valor === "object" && valor) {
      saida.properties = Object.fromEntries(
        Object.entries(valor as Record<string, unknown>).map(([nome, sub]) => [
          nome,
          paraSchemaDoModelo(sub),
        ]),
      );
    } else if (chave === "items") {
      saida.items = paraSchemaDoModelo(valor);
    } else {
      saida[chave] = valor;
    }
  }

  if (dicas.length > 0) {
    const atual = typeof saida.description === "string" ? saida.description : "";
    saida.description = atual
      ? `${atual} (${dicas.join(", ")})`
      : dicas.join(", ");
  }

  // O modelo exige um tipo; objeto vazio confunde.
  if (!saida.type && saida.properties) saida.type = "object";
  return saida;
}

export function schemaDaEntrada(schema: z.ZodType): Record<string, unknown> {
  return paraSchemaDoModelo(z.toJSONSchema(schema, { io: "input" }));
}

/** Um ToolSpec a partir de qualquer action do core. */
export function toolSpec(action: {
  name: string;
  description: string;
  input: z.ZodType;
}): ToolSpec {
  return {
    // Pontos não são aceitos em nome de função; "andar.acao" vira
    // "andar__acao" na fronteira e volta ao normal na execução.
    name: action.name.replace(".", "__"),
    description: action.description,
    parameters: schemaDaEntrada(action.input),
  };
}
