import { describe, expect, it } from "vitest";

import { getLibraryViewMode } from "@/features/library/domain/library-view-mode";

describe("getLibraryViewMode", () => {
  it.each([
    ["WANT_TO_READ", "Quero ler"],
    ["READING", "Lendo"],
    ["FINISHED", "Finalizados"],
  ] as const)("usa o título da estante %s", (status, title) => {
    expect(getLibraryViewMode(status)).toEqual({
      isReadingShelf: true,
      title,
    });
  });

  it.each(["ALL", "ABANDONED"] as const)(
    "mantém a biblioteca como visão geral para %s",
    (status) => {
      expect(getLibraryViewMode(status)).toEqual({
        isReadingShelf: false,
        title: "Biblioteca",
      });
    },
  );
});
