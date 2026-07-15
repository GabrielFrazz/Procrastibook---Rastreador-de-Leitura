import { describe, expect, it } from "vitest";

import { deduplicateCandidates } from "@/features/catalog/domain/deduplicate-candidates";
import type { NormalizedWorkCandidate } from "@/features/catalog/domain/catalog-provider";

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
    isbn10: null,
    isbn13: null,
    language: null,
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

describe("deduplicateCandidates", () => {
  it("funde resultados por ISBN preservando a prioridade e completando campos", () => {
    const primary = candidate({ isbn13: "9788535902778" });
    const fallback = candidate({
      authors: ["Machado de Assis", "Editor Exemplo"],
      coverUrl: "https://covers.example/1.jpg",
      externalId: "/works/OL45804W",
      genres: ["Clássico"],
      isbn13: "9788535902778",
      pageCount: 256,
      provider: "OPEN_LIBRARY",
    });

    expect(deduplicateCandidates([primary, fallback])).toEqual([
      {
        ...primary,
        authors: ["Machado de Assis", "Editor Exemplo"],
        coverUrl: "https://covers.example/1.jpg",
        genres: ["Clássico"],
        pageCount: 256,
      },
    ]);
  });

  it("reconhece título, primeiro autor e ano sem depender de acentos ou pontuação", () => {
    const first = candidate({
      authors: ["José de Alencar"],
      externalId: "google-2",
      publishedYear: 1857,
      title: "O Guarani!",
    });
    const second = candidate({
      authors: ["Jose de Alencar"],
      externalId: "/works/OL2W",
      provider: "OPEN_LIBRARY",
      publishedYear: 1857,
      title: "O guarani",
    });

    expect(deduplicateCandidates([first, second])).toHaveLength(1);
  });

  it("não funde obras de anos diferentes sem um identificador forte", () => {
    const first = candidate({ externalId: "google-3", publishedYear: 1899 });
    const second = candidate({
      externalId: "/works/OL3W",
      provider: "OPEN_LIBRARY",
      publishedYear: 1900,
    });

    expect(deduplicateCandidates([first, second])).toHaveLength(2);
  });

  it("remove referências externas repetidas do mesmo provedor", () => {
    const first = candidate({ publishedYear: null });
    const second = candidate({ authors: [], publishedYear: null });

    expect(deduplicateCandidates([first, second])).toHaveLength(1);
  });
});
