import { describe, expect, it } from "vitest";

import {
  CatalogProviderError,
  validateCatalogQuery,
  type CatalogQuery,
} from "@/features/catalog/domain/catalog-provider";
import completeFixture from "@/features/catalog/providers/fixtures/open-library-complete.json";
import partialFixture from "@/features/catalog/providers/fixtures/open-library-partial.json";
import { OpenLibraryProvider } from "@/features/catalog/providers/open-library-provider";

function validQuery(input: unknown): CatalogQuery {
  const result = validateCatalogQuery(input);

  if (!result.ok) {
    throw new Error("A consulta de teste deveria ser válida.");
  }

  return result.data;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("OpenLibraryProvider", () => {
  it("normaliza uma obra e solicita somente os campos internos necessários", async () => {
    const calls: Array<{ headers: Headers; url: URL }> = [];
    const provider = new OpenLibraryProvider({
      fetcher: async (input, init) => {
        calls.push({
          headers: new Headers(init?.headers),
          url: new URL(String(input)),
        });
        return jsonResponse(completeFixture);
      },
      userAgent: "Procrastibook/0.1 (contact: test@example.com)",
    });

    await expect(
      provider.search(validQuery({ language: "pt", limit: 5, query: "Dom" })),
    ).resolves.toEqual([
      {
        authors: ["Machado de Assis"],
        coverUrl:
          "https://covers.openlibrary.org/b/id/8231856-L.jpg?default=false",
        description: null,
        externalId: "/works/OL45804W",
        genres: ["Brazilian fiction"],
        infoUrl: "https://openlibrary.org/works/OL45804W",
        isbn10: "8535902775",
        isbn13: "9788535902778",
        language: "por",
        pageCount: 256,
        provider: "OPEN_LIBRARY",
        publishedYear: 1899,
        publisher: "Companhia das Letras",
        subtitle: "Texto integral",
        suggestedType: "BOOK",
        title: "Dom Casmurro",
      },
    ]);

    expect(calls).toHaveLength(1);
    const call = calls[0];

    if (!call) {
      throw new Error("A chamada esperada não foi registrada.");
    }

    expect(call.headers.get("Accept")).toBe("application/json");
    expect(call.headers.get("User-Agent")).toContain("test@example.com");
    expect(call.url.origin + call.url.pathname).toBe(
      "https://openlibrary.org/search.json",
    );
    expect(call.url.searchParams.get("fields")).toBe(
      "key,title,subtitle,author_name,first_publish_year,isbn,language,publisher,number_of_pages_median,cover_i,subject",
    );
    expect(call.url.searchParams.get("lang")).toBe("pt");
    expect(call.url.searchParams.get("limit")).toBe("5");
    expect(call.url.searchParams.get("q")).toBe("Dom");
  });

  it("transforma ISBN em busca de campo e tolera metadados parciais", async () => {
    const requestedUrls: string[] = [];
    const provider = new OpenLibraryProvider({
      fetcher: async (input) => {
        requestedUrls.push(String(input));
        return jsonResponse(partialFixture);
      },
      userAgent: "Procrastibook test",
    });

    await expect(
      provider.search(validQuery({ query: "978-85-359-0277-5" })),
    ).resolves.toEqual([
      {
        authors: [],
        coverUrl: null,
        description: null,
        externalId: "/works/OL999W",
        genres: [],
        infoUrl: "https://openlibrary.org/works/OL999W",
        isbn10: null,
        isbn13: null,
        language: null,
        pageCount: null,
        provider: "OPEN_LIBRARY",
        publishedYear: null,
        publisher: null,
        subtitle: null,
        suggestedType: "BOOK",
        title: "Obra sem metadados",
      },
    ]);
    expect(new URL(requestedUrls[0] ?? "").searchParams.get("q")).toBe(
      "isbn:9788535902775",
    );
  });

  it("recupera somente chaves canônicas de obras", async () => {
    const requestedUrls: URL[] = [];
    const provider = new OpenLibraryProvider({
      fetcher: async (input) => {
        requestedUrls.push(new URL(String(input)));
        return jsonResponse(completeFixture);
      },
      userAgent: "Procrastibook test",
    });

    await expect(provider.getById("ol45804w")).resolves.toMatchObject({
      externalId: "/works/OL45804W",
    });
    await expect(provider.getById("/authors/OL1A")).resolves.toBeNull();
    expect(requestedUrls).toHaveLength(1);
    expect(requestedUrls[0]?.searchParams.get("q")).toBe("key:/works/OL45804W");
  });

  it("exige identificação do cliente antes de realizar chamadas", () => {
    expect(() => new OpenLibraryProvider({ userAgent: "  " })).toThrowError(
      "Open Library requires a non-empty User-Agent.",
    );
  });

  it("converte timeout, indisponibilidade e payload inválido em erros estáveis", async () => {
    const query = validQuery({ query: "Teste" });
    const timeoutProvider = new OpenLibraryProvider({
      fetcher: async () => {
        throw new DOMException("timeout", "AbortError");
      },
      userAgent: "Procrastibook test",
    });
    const unavailableProvider = new OpenLibraryProvider({
      fetcher: async () => jsonResponse({}, 503),
      userAgent: "Procrastibook test",
    });
    const invalidProvider = new OpenLibraryProvider({
      fetcher: async () => jsonResponse({ docs: "inválido" }),
      userAgent: "Procrastibook test",
    });

    await expect(timeoutProvider.search(query)).rejects.toMatchObject({
      code: "TIMEOUT",
    } satisfies Partial<CatalogProviderError>);
    await expect(unavailableProvider.search(query)).rejects.toMatchObject({
      code: "UNAVAILABLE",
      status: 503,
    } satisfies Partial<CatalogProviderError>);
    await expect(invalidProvider.search(query)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    } satisfies Partial<CatalogProviderError>);
  });
});
