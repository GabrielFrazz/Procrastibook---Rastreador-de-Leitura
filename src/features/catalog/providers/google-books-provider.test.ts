import { describe, expect, it, vi } from "vitest";

import {
  CatalogProviderError,
  validateCatalogQuery,
  type CatalogQuery,
} from "@/features/catalog/domain/catalog-provider";
import completeFixture from "@/features/catalog/providers/fixtures/google-books-complete.json";
import partialFixture from "@/features/catalog/providers/fixtures/google-books-partial.json";
import { GoogleBooksProvider } from "@/features/catalog/providers/google-books-provider";

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

describe("GoogleBooksProvider", () => {
  it("normaliza metadados completos sem expor HTML externo", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      jsonResponse(completeFixture),
    );
    const provider = new GoogleBooksProvider({ fetcher });

    await expect(
      provider.search(validQuery({ query: "Leitura" })),
    ).resolves.toEqual([
      {
        authors: ["Autora Principal", "Coautor"],
        coverUrl: "https://books.google.com/books/content?id=complete",
        description: "Uma descrição segura & útil.",
        externalId: "google-complete-1",
        genres: ["Ficção", "Clássicos"],
        infoUrl: "https://books.google.com/books?id=complete",
        isbn10: "8535902775",
        isbn13: "9788535902775",
        language: "pt-BR",
        pageCount: 176,
        provider: "GOOGLE_BOOKS",
        publishedYear: 2021,
        publisher: "Editora Exemplo",
        subtitle: "Uma edição especial",
        suggestedType: "EBOOK",
        title: "O Livro & a Leitura",
      },
    ]);
  });

  it("tolera campos ausentes e ignora volumes estruturalmente inválidos", async () => {
    const provider = new GoogleBooksProvider({
      fetcher: async () => jsonResponse(partialFixture),
    });

    await expect(
      provider.search(validQuery({ query: "Obra" })),
    ).resolves.toEqual([
      {
        authors: [],
        coverUrl: null,
        description: null,
        externalId: "google-partial-1",
        genres: [],
        infoUrl: null,
        isbn10: null,
        isbn13: null,
        language: null,
        pageCount: null,
        provider: "GOOGLE_BOOKS",
        publishedYear: null,
        publisher: null,
        subtitle: null,
        suggestedType: "BOOK",
        title: "Obra sem metadados opcionais",
      },
    ]);
  });

  it("monta busca por ISBN com parâmetros limitados e chave somente no servidor", async () => {
    const requestedUrls: string[] = [];
    const provider = new GoogleBooksProvider({
      apiKey: "server-key",
      fetcher: async (input) => {
        requestedUrls.push(String(input));
        return jsonResponse({ items: [] });
      },
    });

    await provider.search(
      validQuery({ language: "pt", limit: 5, query: "978-85-359-0277-5" }),
    );

    const url = new URL(requestedUrls[0] ?? "");
    expect(url.origin + url.pathname).toBe(
      "https://www.googleapis.com/books/v1/volumes",
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      key: "server-key",
      langRestrict: "pt",
      maxResults: "5",
      printType: "books",
      projection: "full",
      q: "isbn:9788535902775",
    });
  });

  it("recupera um volume por id e trata ausência como nula", async () => {
    const requestedUrls: string[] = [];
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      requestedUrls.push(String(input));

      return requestedUrls.length === 1
        ? jsonResponse(completeFixture.items[0])
        : jsonResponse({}, 404);
    });
    const provider = new GoogleBooksProvider({ fetcher });

    await expect(provider.getById("id/com barra")).resolves.toMatchObject({
      externalId: "google-complete-1",
    });
    await expect(provider.getById("não-encontrado")).resolves.toBeNull();
    expect(requestedUrls[0]).toContain("id%2Fcom%20barra");
  });

  it("aborta a chamada quando o provedor excede o timeout", async () => {
    vi.useFakeTimers();

    try {
      const fetcher = vi.fn<typeof fetch>(
        async (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => reject(new DOMException("timeout", "AbortError")),
              { once: true },
            );
          }),
      );
      const provider = new GoogleBooksProvider({ fetcher, timeoutMs: 50 });
      const request = expect(
        provider.search(validQuery({ query: "Teste" })),
      ).rejects.toMatchObject({ code: "TIMEOUT" });

      await vi.advanceTimersByTimeAsync(51);
      await request;
      expect(fetcher).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
  it("converte timeout, indisponibilidade e payload inválido em erros estáveis", async () => {
    const query = validQuery({ query: "Teste" });
    const timeoutProvider = new GoogleBooksProvider({
      fetcher: async () => {
        throw new DOMException("timeout", "AbortError");
      },
    });
    const unavailableProvider = new GoogleBooksProvider({
      fetcher: async () => jsonResponse({}, 503),
    });
    const invalidProvider = new GoogleBooksProvider({
      fetcher: async () => jsonResponse({ items: "inválido" }),
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
