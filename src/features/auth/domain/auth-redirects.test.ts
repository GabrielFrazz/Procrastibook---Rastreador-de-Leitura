import { describe, expect, it } from "vitest";

import { createAuthCallbackUrl } from "@/features/auth/domain/auth-redirects";

describe("createAuthCallbackUrl", () => {
  it("cria um callback absoluto com destino interno", () => {
    expect(createAuthCallbackUrl("/library/new", "http://localhost:3000")).toBe(
      "http://localhost:3000/auth/callback?next=%2Flibrary%2Fnew",
    );
  });

  it("substitui destinos externos pelo dashboard", () => {
    expect(
      createAuthCallbackUrl("https://evil.example", "http://localhost:3000"),
    ).toBe("http://localhost:3000/auth/callback?next=%2Fdashboard");
  });
});
