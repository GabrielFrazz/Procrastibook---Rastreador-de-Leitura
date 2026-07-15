import { describe, expect, it, vi } from "vitest";

import {
  beginGoogleOAuth,
  type GoogleOAuthApi,
} from "@/features/auth/services/google-oauth-service";

function createAuth(
  url: string | null,
  error: { message?: string } | null = null,
) {
  return {
    signInWithOAuth: vi.fn(async () => ({ data: { url }, error })),
  } satisfies GoogleOAuthApi;
}

describe("beginGoogleOAuth", () => {
  it("inicia o provedor com callback e sem redirecionamento automático", async () => {
    const authorizationUrl =
      "http://127.0.0.1:54321/auth/v1/authorize?provider=google";
    const auth = createAuth(authorizationUrl);
    const callbackUrl = "http://localhost:3000/auth/callback?next=%2Fdashboard";

    await expect(
      beginGoogleOAuth(auth, callbackUrl, "http://127.0.0.1:54321"),
    ).resolves.toEqual({ ok: true, data: { url: authorizationUrl } });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: callbackUrl, skipBrowserRedirect: true },
    });
  });

  it.each([
    "https://evil.example/auth/v1/authorize",
    "http://127.0.0.1:54321/storage/v1/object",
    "not-a-url",
  ])("bloqueia redirecionamento não confiável: %s", async (url) => {
    const auth = createAuth(url);
    await expect(
      beginGoogleOAuth(
        auth,
        "http://localhost:3000/auth/callback",
        "http://127.0.0.1:54321",
      ),
    ).resolves.toMatchObject({ ok: false, code: "OAUTH_UNAVAILABLE" });
  });

  it("não expõe erros do provedor", async () => {
    const auth = createAuth(null, { message: "private detail" });
    await expect(
      beginGoogleOAuth(
        auth,
        "http://localhost:3000/auth/callback",
        "http://127.0.0.1:54321",
      ),
    ).resolves.toEqual({
      ok: false,
      code: "OAUTH_UNAVAILABLE",
      message: "Não foi possível iniciar a entrada com Google agora.",
    });
  });
});
