import { describe, expect, it, vi } from "vitest";

import {
  CatalogProviderError,
  type CatalogProvider,
  type CatalogQuery,
  type ExternalProvider,
  type NormalizedWorkCandidate,
} from "@/features/catalog/domain/catalog-provider";
import { CatalogSearchService } from "@/features/catalog/services/catalog-search-service";

const query: CatalogQuery = { language: "pt", limit: 2, query: "Dom" };

function candidate(
  overrides: Partial<NormalizedWorkCandidate> = {},
): NormalizedWorkCandidate {
  return {
    authors: ["Machado de Assis"],
    coverUrl: null,
    description: null,
    externalId: "google-1",
    genres: [],
    infoUrl: null,
    isbn10: "8535902775",
    isbn13: "9788535902778",
    language: "pt-BR",
    pageCount: null,
    provider: "GOOGLE_BOOKS",
    publishedYear: 1899,
    publisher: null,
    subtitle: null,
    suggestedType: "BOOK",
    title: "Dom Casmurro",
    ...overrides,
  };
}

function provider(
  providerName: ExternalProvider,
  search: CatalogProvider["search"],
): CatalogProvider {
  return {
    getById: async () => null,
    provider: providerName,
    search,
  };
}

describe("CatalogSearchService", () => {
  it("não consulta o fallback quando a fonte primária preenche o limite", async () => {
    const primaryResults = [
      candidate(),
      candidate({
        externalId: "google-2",
        isbn10: "8535912770",
        isbn13: "9788535912777",
        publishedYear: 1881,
        title: "Memórias Póstumas de Brás Cubas",
      }),
    ];
    const fallbackSearch = vi.fn<CatalogProvider["search"]>();
    const service = new CatalogSearchService({
      fallback: provider("OPEN_LIBRARY", fallbackSearch),
      primary: provider("GOOGLE_BOOKS", async () => primaryResults),
    });

    await expect(service.search(query)).resolves.toEqual(primaryResults);
    expect(fallbackSearch).not.toHaveBeenCalled();
  });

  it("consulta o fallback quando resultados suficientes não possuem identificadores", async () => {
    const primaryResults = [
      candidate({ isbn10: null, isbn13: null }),
      candidate({
        externalId: "google-2",
        isbn10: null,
        isbn13: null,
        publishedYear: 1881,
        title: "Memórias Póstumas de Brás Cubas",
      }),
    ];
    const fallbackSearch = vi.fn<CatalogProvider["search"]>(async () => []);
    const service = new CatalogSearchService({
      fallback: provider("OPEN_LIBRARY", fallbackSearch),
      primary: provider("GOOGLE_BOOKS", async () => primaryResults),
    });

    await expect(service.search(query)).resolves.toEqual(primaryResults);
    expect(fallbackSearch).toHaveBeenCalledOnce();
  });
  it("completa resultados parciais e remove duplicatas entre provedores", async () => {
    const primary = candidate({ coverUrl: null });
    const duplicate = candidate({
      coverUrl: "https://covers.example/dom.jpg",
      externalId: "/works/OL45804W",
      provider: "OPEN_LIBRARY",
    });
    const unique = candidate({
      externalId: "/works/OL4W",
      isbn10: null,
      isbn13: "9788535919998",
      provider: "OPEN_LIBRARY",
      title: "Memórias Póstumas de Brás Cubas",
    });
    const service = new CatalogSearchService({
      fallback: provider("OPEN_LIBRARY", async () => [duplicate, unique]),
      primary: provider("GOOGLE_BOOKS", async () => [primary]),
    });

    await expect(service.search(query)).resolves.toEqual([
      { ...primary, coverUrl: "https://covers.example/dom.jpg" },
      unique,
    ]);
  });

  it("usa somente o fallback quando a fonte primária falha", async () => {
    const fallbackResult = candidate({
      externalId: "/works/OL5W",
      provider: "OPEN_LIBRARY",
    });
    const service = new CatalogSearchService({
      fallback: provider("OPEN_LIBRARY", async () => [fallbackResult]),
      primary: provider("GOOGLE_BOOKS", async () => {
        throw new CatalogProviderError("TIMEOUT");
      }),
    });

    await expect(service.search(query)).resolves.toEqual([fallbackResult]);
  });

  it("preserva resultados primários quando apenas o fallback falha", async () => {
    const primaryResult = candidate({ isbn10: null, isbn13: null });
    const service = new CatalogSearchService({
      fallback: provider("OPEN_LIBRARY", async () => {
        throw new CatalogProviderError("UNAVAILABLE");
      }),
      primary: provider("GOOGLE_BOOKS", async () => [primaryResult]),
    });

    await expect(service.search(query)).resolves.toEqual([primaryResult]);
  });

  it("expõe um erro estável quando nenhuma fonte responde", async () => {
    const failingProvider = (providerName: ExternalProvider) =>
      provider(providerName, async () => {
        throw new Error("falha privada do provedor");
      });
    const service = new CatalogSearchService({
      fallback: failingProvider("OPEN_LIBRARY"),
      primary: failingProvider("GOOGLE_BOOKS"),
    });

    await expect(service.search(query)).rejects.toMatchObject({
      code: "UNAVAILABLE",
      message: "O catálogo está temporariamente indisponível.",
    } satisfies Partial<CatalogProviderError>);
  });
});
