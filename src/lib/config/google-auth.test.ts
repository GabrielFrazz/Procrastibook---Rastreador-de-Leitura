import { describe, expect, it } from "vitest";

import { isGoogleAuthEnabled } from "@/lib/config/google-auth";

describe("isGoogleAuthEnabled", () => {
  it.each([undefined, "", "false", " FALSE "])(
    "mantém o provedor desabilitado para %s",
    (value) => {
      expect(isGoogleAuthEnabled(value)).toBe(false);
    },
  );

  it("habilita apenas com confirmação explícita", () => {
    expect(isGoogleAuthEnabled(" TRUE ")).toBe(true);
  });

  it("rejeita configuração ambígua", () => {
    expect(() => isGoogleAuthEnabled("yes")).toThrow(
      "GOOGLE_AUTH_ENABLED deve ser true ou false.",
    );
  });
});
