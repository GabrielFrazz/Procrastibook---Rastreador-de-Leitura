import type { Database } from "@/lib/supabase/database.types";

type WorkRow = Database["public"]["Tables"]["works"]["Row"];

export type LibrarySort = "PROGRESS_DESC" | "TITLE_ASC" | "UPDATED_DESC";

export type LibraryWork = Readonly<{
  authors: readonly string[];
  coverUrl: string | null;
  currentProgress: number;
  genres: readonly string[];
  id: string;
  progressPercent: number | null;
  progressUnit: WorkRow["progress_unit"];
  rating: number | null;
  status: WorkRow["status"];
  subtitle: string | null;
  title: string;
  totalProgress: number | null;
  type: WorkRow["type"];
  updatedAt: string;
}>;

export type LibraryFilters = Readonly<{
  genre: string;
  query: string;
  sort: LibrarySort;
  status: "ALL" | WorkRow["status"];
  type: "ALL" | WorkRow["type"];
}>;

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

export function getWorkTotal(
  work: Pick<WorkRow, "chapter_count" | "page_count" | "progress_unit">,
) {
  if (work.progress_unit === "PERCENT") {
    return 100;
  }

  return work.progress_unit === "PAGE" ? work.page_count : work.chapter_count;
}

export function getProgressPercent(current: number, total: number | null) {
  if (total === null || total <= 0) {
    return null;
  }

  return Math.min(100, Math.round((current / total) * 1000) / 10);
}

export function filterAndSortLibraryWorks(
  works: readonly LibraryWork[],
  filters: LibraryFilters,
) {
  const normalizedQuery = normalizeSearchValue(filters.query);

  return works
    .filter((work) => {
      const searchableContent = normalizeSearchValue(
        [work.title, work.subtitle, ...work.authors].filter(Boolean).join(" "),
      );

      return (
        (normalizedQuery === "" ||
          searchableContent.includes(normalizedQuery)) &&
        (filters.status === "ALL" || work.status === filters.status) &&
        (filters.type === "ALL" || work.type === filters.type) &&
        (filters.genre === "ALL" || work.genres.includes(filters.genre))
      );
    })
    .sort((first, second) => {
      if (filters.sort === "TITLE_ASC") {
        return first.title.localeCompare(second.title, "pt-BR");
      }

      if (filters.sort === "PROGRESS_DESC") {
        return (
          (second.progressPercent ?? -1) - (first.progressPercent ?? -1) ||
          first.title.localeCompare(second.title, "pt-BR")
        );
      }

      return (
        second.updatedAt.localeCompare(first.updatedAt) ||
        first.title.localeCompare(second.title, "pt-BR")
      );
    });
}
