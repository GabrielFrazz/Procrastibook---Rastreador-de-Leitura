import { describe, expect, it } from "vitest";

import { getActiveNavigationHref } from "./app-shell-navigation";

const navigationHrefs = [
  "/dashboard",
  "/library",
  "/library/new",
  "/library?status=READING",
  "/library?status=FINISHED",
  "/lists",
];

describe("getActiveNavigationHref", () => {
  it("mantém Biblioteca ativa nas páginas de detalhe", () => {
    expect(getActiveNavigationHref("/library/obra-123", navigationHrefs)).toBe(
      "/library",
    );
  });

  it("prioriza a rota específica de adicionar obra", () => {
    expect(getActiveNavigationHref("/library/new", navigationHrefs)).toBe(
      "/library/new",
    );
  });

  it("diferencia os filtros da biblioteca pela query string", () => {
    expect(
      getActiveNavigationHref(
        "/library?status=READING&sort=updated",
        navigationHrefs,
      ),
    ).toBe("/library?status=READING");
    expect(
      getActiveNavigationHref("/library?status=FINISHED", navigationHrefs),
    ).toBe("/library?status=FINISHED");
  });

  it("não marca uma rota sem relação com a navegação", () => {
    expect(
      getActiveNavigationHref("/profile", navigationHrefs),
    ).toBeUndefined();
  });
});
