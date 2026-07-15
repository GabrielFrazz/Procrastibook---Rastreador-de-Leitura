import { describe, expect, it } from "vitest";

import {
  validateForgotPasswordForm,
  validateLoginForm,
  validateSignupForm,
} from "@/features/auth/domain/email-auth-validation";

function createFormData(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("validateLoginForm", () => {
  it("normaliza o e-mail e preserva a senha", () => {
    expect(
      validateLoginForm(
        createFormData({
          email: "  LEITOR@EXAMPLE.COM ",
          password: "senha segura",
        }),
      ),
    ).toEqual({
      ok: true,
      data: { email: "leitor@example.com", password: "senha segura" },
    });
  });

  it("retorna erros por campo", () => {
    const result = validateLoginForm(
      createFormData({ email: "inválido", password: "" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toContain("Informe um e-mail válido.");
      expect(result.fieldErrors.password).toContain("Informe sua senha.");
    }
  });
});

describe("validateSignupForm", () => {
  it("normaliza nome e e-mail válidos", () => {
    expect(
      validateSignupForm(
        createFormData({
          displayName: "  Gabriel   Silva ",
          email: "GABRIEL@example.com",
          password: "uma-senha-segura",
          passwordConfirmation: "uma-senha-segura",
        }),
      ),
    ).toEqual({
      ok: true,
      data: {
        displayName: "Gabriel Silva",
        email: "gabriel@example.com",
        password: "uma-senha-segura",
      },
    });
  });

  it("exige nome, senha mínima e confirmação igual", () => {
    const result = validateSignupForm(
      createFormData({
        displayName: "G",
        email: "gabriel@example.com",
        password: "curta",
        passwordConfirmation: "diferente",
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.displayName).toBeDefined();
      expect(result.fieldErrors.password).toBeDefined();
      expect(result.fieldErrors.passwordConfirmation).toBeDefined();
    }
  });
});

describe("validateForgotPasswordForm", () => {
  it("aceita um e-mail válido", () => {
    expect(
      validateForgotPasswordForm(
        createFormData({ email: "reader@example.com" }),
      ),
    ).toEqual({ ok: true, data: { email: "reader@example.com" } });
  });

  it("rejeita um e-mail inválido", () => {
    expect(
      validateForgotPasswordForm(createFormData({ email: "reader" })).ok,
    ).toBe(false);
  });
});
