import { describe, expect, it } from "vitest";

import { validateCatalogQuery } from "@/features/catalog/domain/catalog-provider";

describe("consulta de catálogo", () => {
  it("normaliza consulta, idioma e limite padrão", () => {
    expect(
      validateCatalogQuery({ language: " PT ", query: "  Dom Casmurro  " }),
    ).toEqual({
      data: { language: "pt", limit: 10, query: "Dom Casmurro" },
      ok: true,
    });
  });

  it("aceita limite recebido como parâmetro de URL", () => {
    expect(validateCatalogQuery({ limit: "5", query: "Clarice" })).toEqual({
      data: { language: null, limit: 5, query: "Clarice" },
      ok: true,
    });
  });

  it("rejeita consulta curta, idioma inválido e limite excessivo", () => {
    const result = validateCatalogQuery({
      language: "português",
      limit: 21,
      query: "a",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors).toEqual({
        language: ["Use um código de idioma com duas letras."],
        limit: ["Solicite no máximo vinte resultados."],
        query: ["Digite pelo menos dois caracteres."],
      });
    }
  });
});
