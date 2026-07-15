import { describe, expect, it } from "vitest";

import { createAppUrl, getAppUrl } from "@/lib/config/app-url";

describe("getAppUrl", () => {
  it("normaliza a URL pública", () => {
    expect(getAppUrl(" http://localhost:3000/ ")).toBe("http://localhost:3000");
  });

  it("rejeita protocolos que não sejam HTTP", () => {
    expect(() => getAppUrl("javascript:alert(1)")).toThrow(
      "deve usar HTTP ou HTTPS",
    );
  });

  it("rejeita credenciais embutidas", () => {
    expect(() => getAppUrl("https://user:secret@example.com")).toThrow(
      "não deve conter credenciais",
    );
  });

  it("cria URLs absolutas da própria aplicação", () => {
    expect(createAppUrl("/auth/callback", "https://example.com")).toBe(
      "https://example.com/auth/callback",
    );
  });
});
