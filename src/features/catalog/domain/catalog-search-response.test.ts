import { describe, expect, it } from "vitest";

import { parseCatalogSearchResponse } from "@/features/catalog/domain/catalog-search-response";

const candidate = {
  authors: ["Machado de Assis"],
  coverUrl: null,
  description: null,
  externalId: "google-1",
  genres: ["Clássico"],
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

describe("parseCatalogSearchResponse", () => {
  it("aceita somente candidatos normalizados", () => {
    expect(parseCatalogSearchResponse({ data: [candidate] })).toEqual([
      candidate,
    ]);
    expect(
      parseCatalogSearchResponse({ data: [{ ...candidate, title: 42 }] }),
    ).toBeNull();
    expect(parseCatalogSearchResponse({ items: [candidate] })).toBeNull();
  });
});
