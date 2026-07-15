import { describe, expect, it } from "vitest";

import { getSafeNextPath } from "@/features/auth/domain/safe-next-path";

describe("getSafeNextPath", () => {
  it("preserva somente destinos internos", () => {
    expect(getSafeNextPath("/library?status=READING")).toBe(
      "/library?status=READING",
    );
  });

  it.each([
    undefined,
    null,
    "",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/dashboard\nSet-Cookie:test",
  ])("substitui destino inválido %s", (value) => {
    expect(getSafeNextPath(value)).toBe("/dashboard");
  });
});
