import { describe, expect, it } from "vitest";

import { getPlaceholderTone } from "@/components/ui/media-placeholder";

describe("getPlaceholderTone", () => {
  it("é determinístico para o mesmo título", () => {
    expect(getPlaceholderTone("O Nome do Vento")).toBe(
      getPlaceholderTone("O Nome do Vento"),
    );
  });

  it("sempre retorna um tom suportado", () => {
    expect(["oat", "linen", "peach"]).toContain(
      getPlaceholderTone("Uma história qualquer"),
    );
  });

  it("mantém fallback válido para texto vazio", () => {
    expect(getPlaceholderTone("")).toBe("oat");
  });
});
