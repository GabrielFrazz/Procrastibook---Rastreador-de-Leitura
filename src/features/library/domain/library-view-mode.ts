import type { LibraryWork } from "@/features/library/domain/library-catalog";

type LibraryStatus = "ALL" | LibraryWork["status"];

export type LibraryViewMode = Readonly<{
  isReadingShelf: boolean;
  title: string;
}>;

const READING_SHELF_TITLES: Partial<Record<LibraryWork["status"], string>> = {
  FINISHED: "Finalizados",
  READING: "Lendo",
  WANT_TO_READ: "Quero ler",
};

export function getLibraryViewMode(status: LibraryStatus): LibraryViewMode {
  const title = status === "ALL" ? undefined : READING_SHELF_TITLES[status];

  return title
    ? { isReadingShelf: true, title }
    : { isReadingShelf: false, title: "Biblioteca" };
}
