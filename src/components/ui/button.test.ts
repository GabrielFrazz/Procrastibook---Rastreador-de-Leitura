import { describe, expect, it } from "vitest";

import { getButtonClassName } from "@/components/ui/button";

describe("getButtonClassName", () => {
  it("combina variante, tamanho e classe opcional", () => {
    expect(getButtonClassName("secondary", "lg", "custom")).toBe(
      "ui-button ui-button--secondary ui-button--lg custom",
    );
  });

  it("não adiciona modificador para o tamanho padrão", () => {
    expect(getButtonClassName("primary", "md")).toBe(
      "ui-button ui-button--primary",
    );
  });
});
