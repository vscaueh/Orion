import { z } from "zod";
import { describe, expect, it } from "vitest";
import { paraSchemaDoModelo, schemaDaEntrada, toolSpec } from "./schema-json";

describe("paraSchemaDoModelo", () => {
  it("tira o que o modelo não aceita", () => {
    const schema = schemaDaEntrada(z.object({ nome: z.string().min(3) }));
    expect(schema).toEqual({
      type: "object",
      properties: { nome: { type: "string" } },
      required: ["nome"],
    });
  });

  it("campo opcional vira nullable em vez de anyOf", () => {
    const schema = schemaDaEntrada(z.object({ obs: z.string().nullish() }));
    expect(schema.properties).toEqual({
      obs: { type: "string", nullable: true },
    });
  });

  it("o formato perdido vira dica na descrição", () => {
    const schema = schemaDaEntrada(z.object({ data: z.iso.date() }));
    const data = (
      schema.properties as Record<string, { description?: string }>
    ).data;
    expect(data?.description).toContain("YYYY-MM-DD");
  });

  it("mantém enum, que o modelo usa para escolher", () => {
    const schema = schemaDaEntrada(
      z.object({ tipo: z.enum(["alta", "baixa"]) }),
    );
    expect(schema.properties).toEqual({
      tipo: { type: "string", enum: ["alta", "baixa"] },
    });
  });

  it("desce em arrays e objetos aninhados", () => {
    const schema = schemaDaEntrada(
      z.object({ dias: z.array(z.number().int().min(0).max(6)) }),
    );
    expect(schema.properties).toEqual({
      dias: { type: "array", items: { type: "integer" } },
    });
  });

  it("schema vazio não quebra", () => {
    expect(paraSchemaDoModelo(null)).toEqual({});
  });
});

describe("toolSpec", () => {
  it("troca o ponto do nome da action por underscore duplo", () => {
    const spec = toolSpec({
      name: "faculdade.criar_cadeira",
      description: "Cria uma cadeira.",
      input: z.object({ nome: z.string() }),
    });
    expect(spec.name).toBe("faculdade__criar_cadeira");
    expect(spec.description).toBe("Cria uma cadeira.");
  });
});
