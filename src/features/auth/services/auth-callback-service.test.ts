import { describe, expect, it, vi } from "vitest";

import {
  exchangeAuthCode,
  type AuthCodeExchangeApi,
} from "@/features/auth/services/auth-callback-service";

function createAuth(error: { code?: string; message?: string } | null = null) {
  return {
    exchangeCodeForSession: vi.fn(async () => ({ error })),
  } satisfies AuthCodeExchangeApi;
}

describe("exchangeAuthCode", () => {
  it("troca o código por uma sessão", async () => {
    const auth = createAuth();
    await expect(exchangeAuthCode(auth, "one-use-code")).resolves.toEqual({
      ok: true,
      data: null,
    });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("one-use-code");
  });

  it("não expõe detalhes do provedor", async () => {
    const auth = createAuth({ message: "private provider detail" });
    await expect(exchangeAuthCode(auth, "invalid")).resolves.toEqual({
      ok: false,
      code: "INVALID_CALLBACK",
      message: "O link de autenticação é inválido ou expirou.",
    });
  });

  it("rejeita código ausente antes de chamar o provedor", async () => {
    const auth = createAuth();
    await expect(exchangeAuthCode(auth, "")).resolves.toMatchObject({
      ok: false,
      code: "INVALID_CALLBACK",
    });
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
