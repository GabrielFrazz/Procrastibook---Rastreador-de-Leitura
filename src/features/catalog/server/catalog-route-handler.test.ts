import { describe, expect, it, vi } from "vitest";

import type { NormalizedWorkCandidate } from "@/features/catalog/domain/catalog-provider";
import {
  handleCatalogSearchRequest,
  type CatalogRouteDependencies,
} from "@/features/catalog/server/catalog-route-handler";

const candidate: NormalizedWorkCandidate = {
  authors: ["Machado de Assis"],
  coverUrl: null,
  description: null,
  externalId: "google-1",
  genres: [],
  infoUrl: null,
  isbn10: null,
  isbn13: "9788535902778",
  language: "pt-BR",
  pageCount: 256,
  provider: "GOOGLE_BOOKS",
  publishedYear: 1899,
  publisher: null,
  subtitle: null,
  suggestedType: "BOOK",
  title: "Dom Casmurro",
};

function dependencies(
  overrides: Partial<CatalogRouteDependencies> = {},
): CatalogRouteDependencies {
  return {
    consumeRateLimit: () => ({ allowed: true, remaining: 9 }),
    getUserId: async () => "user-a",
    search: async () => [candidate],
    ...overrides,
  };
}

describe("handleCatalogSearchRequest", () => {
  it("exige autenticação antes de validar ou buscar", async () => {
    const search = vi.fn<CatalogRouteDependencies["search"]>();
    const response = await handleCatalogSearchRequest(
      new Request("http://localhost/api/catalog/search?q=Dom"),
      dependencies({ getUserId: async () => null, search }),
    );

    expect(response.status).toBe(401);
    expect(search).not.toHaveBeenCalled();
  });

  it("valida, normaliza e encaminha a consulta autenticada", async () => {
    const search = vi.fn<CatalogRouteDependencies["search"]>(async () => [
      candidate,
    ]);
    const response = await handleCatalogSearchRequest(
      new Request(
        "http://localhost/api/catalog/search?q=+Dom+Casmurro+&language=PT&limit=5",
      ),
      dependencies({ search }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(search).toHaveBeenCalledWith({
      language: "pt",
      limit: 5,
      query: "Dom Casmurro",
    });
    await expect(response.json()).resolves.toEqual({ data: [candidate] });
  });

  it("retorna erros seguros para consulta inválida e falha externa", async () => {
    const invalidResponse = await handleCatalogSearchRequest(
      new Request("http://localhost/api/catalog/search?q=a"),
      dependencies(),
    );
    const unavailableResponse = await handleCatalogSearchRequest(
      new Request("http://localhost/api/catalog/search?q=Dom"),
      dependencies({
        search: async () => {
          throw new Error("detalhe privado");
        },
      }),
    );

    expect(invalidResponse.status).toBe(400);
    expect(unavailableResponse.status).toBe(503);
    expect(await unavailableResponse.text()).not.toContain("detalhe privado");
  });

  it("informa quando o limite foi atingido", async () => {
    const response = await handleCatalogSearchRequest(
      new Request("http://localhost/api/catalog/search?q=Dom"),
      dependencies({
        consumeRateLimit: () => ({
          allowed: false,
          retryAfterSeconds: 42,
        }),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
  });
});
