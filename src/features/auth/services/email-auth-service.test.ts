import { describe, expect, it, vi } from "vitest";

import {
  mapAuthError,
  requestPasswordRecovery,
  signInWithEmail,
  signOutCurrentSession,
  signUpWithEmail,
  type EmailAuthApi,
} from "@/features/auth/services/email-auth-service";

function createAuthApi(
  error: { code?: string; message?: string } | null = null,
) {
  return {
    signInWithPassword: vi.fn(async () => ({ error })),
    signUp: vi.fn(async () => ({ error })),
    resetPasswordForEmail: vi.fn(async () => ({ error })),
    signOut: vi.fn(async () => ({ error })),
  } satisfies EmailAuthApi;
}

describe("email auth service", () => {
  it("não enumera uma conta já cadastrada", () => {
    expect(mapAuthError({ code: "user_already_exists" }, "signup")).toEqual({
      ok: true,
      data: null,
    });
  });

  it("traduz credenciais inválidas sem expor detalhes", () => {
    expect(
      mapAuthError({ code: "invalid_credentials" }, "login"),
    ).toMatchObject({
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "E-mail ou senha inválidos.",
    });
  });

  it("envia login normalizado ao Supabase", async () => {
    const auth = createAuthApi();
    await expect(
      signInWithEmail(auth, {
        email: "reader@example.com",
        password: "secret123",
      }),
    ).resolves.toEqual({ ok: true, data: null });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "secret123",
    });
  });

  it("envia metadados e callback no cadastro", async () => {
    const auth = createAuthApi();
    await signUpWithEmail(
      auth,
      {
        displayName: "Reader",
        email: "reader@example.com",
        password: "secret123",
      },
      "http://localhost:3000/auth/callback?next=%2Fdashboard",
    );
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "secret123",
      options: {
        data: { display_name: "Reader" },
        emailRedirectTo:
          "http://localhost:3000/auth/callback?next=%2Fdashboard",
      },
    });
  });

  it("solicita recuperação com retorno controlado", async () => {
    const auth = createAuthApi();
    await requestPasswordRecovery(
      auth,
      "reader@example.com",
      "http://localhost:3000/auth/callback?next=%2Fupdate-password",
    );
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "reader@example.com",
      {
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Fupdate-password",
      },
    );
  });

  it("encerra somente a sessão atual", async () => {
    const auth = createAuthApi();
    await signOutCurrentSession(auth);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("trata falhas inesperadas sem revelar a exceção", async () => {
    const auth = createAuthApi();
    auth.signInWithPassword.mockRejectedValueOnce(new Error("private detail"));
    await expect(
      signInWithEmail(auth, {
        email: "reader@example.com",
        password: "secret123",
      }),
    ).resolves.toMatchObject({ ok: false, code: "AUTH_UNAVAILABLE" });
  });
});
