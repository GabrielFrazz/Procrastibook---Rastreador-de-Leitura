import { describe, expect, it } from "vitest";

import {
  filterAndSortLibraryWorks,
  getProgressPercent,
  getWorkTotal,
  type LibraryFilters,
  type LibraryWork,
} from "@/features/library/domain/library-catalog";

const baseWork: LibraryWork = {
  authors: ["Conceição Evaristo"],
  coverUrl: null,
  currentProgress: 50,
  genres: ["Literatura brasileira"],
  id: "work-1",
  progressPercent: 50,
  progressUnit: "PERCENT",
  rating: null,
  status: "READING",
  subtitle: null,
  title: "Olhos d'água",
  totalProgress: 100,
  type: "EBOOK",
  updatedAt: "2026-07-15T12:00:00.000Z",
};

const defaultFilters: LibraryFilters = {
  genre: "ALL",
  query: "",
  sort: "UPDATED_DESC",
  status: "ALL",
  type: "ALL",
};

describe("catálogo da biblioteca", () => {
  it("calcula o total coerente com a unidade de progresso", () => {
    expect(
      getWorkTotal({
        chapter_count: 24,
        page_count: null,
        progress_unit: "CHAPTER",
      }),
    ).toBe(24);
    expect(
      getWorkTotal({
        chapter_count: null,
        page_count: 320,
        progress_unit: "PAGE",
      }),
    ).toBe(320);
    expect(
      getWorkTotal({
        chapter_count: null,
        page_count: null,
        progress_unit: "PERCENT",
      }),
    ).toBe(100);
  });

  it("calcula e limita o percentual, preservando total desconhecido", () => {
    expect(getProgressPercent(25, 100)).toBe(25);
    expect(getProgressPercent(125, 100)).toBe(100);
    expect(getProgressPercent(20, null)).toBeNull();
  });

  it("busca por título e autoria sem depender de acentos", () => {
    const byTitle = filterAndSortLibraryWorks([baseWork], {
      ...defaultFilters,
      query: "olhos dagua",
    });
    const byAuthor = filterAndSortLibraryWorks([baseWork], {
      ...defaultFilters,
      query: "conceicao",
    });

    expect(byTitle).toHaveLength(1);
    expect(byAuthor).toHaveLength(1);
  });

  it("combina filtros de status, tipo e gênero", () => {
    const matching = filterAndSortLibraryWorks([baseWork], {
      ...defaultFilters,
      genre: "Literatura brasileira",
      status: "READING",
      type: "EBOOK",
    });
    const notMatching = filterAndSortLibraryWorks([baseWork], {
      ...defaultFilters,
      status: "FINISHED",
    });

    expect(matching).toHaveLength(1);
    expect(notMatching).toHaveLength(0);
  });

  it("ordena sem alterar a coleção recebida", () => {
    const older = {
      ...baseWork,
      id: "work-2",
      progressPercent: 80,
      title: "A paixão segundo G.H.",
      updatedAt: "2026-07-10T12:00:00.000Z",
    };
    const input = [baseWork, older];

    const byProgress = filterAndSortLibraryWorks(input, {
      ...defaultFilters,
      sort: "PROGRESS_DESC",
    });
    const byTitle = filterAndSortLibraryWorks(input, {
      ...defaultFilters,
      sort: "TITLE_ASC",
    });

    expect(byProgress.map((work) => work.id)).toEqual(["work-2", "work-1"]);
    expect(byTitle.map((work) => work.id)).toEqual(["work-2", "work-1"]);
    expect(input.map((work) => work.id)).toEqual(["work-1", "work-2"]);
  });
});
