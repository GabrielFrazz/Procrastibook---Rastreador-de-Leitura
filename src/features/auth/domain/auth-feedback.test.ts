import { describe, expect, it } from "vitest";

import { getLoginFeedback } from "@/features/auth/domain/auth-feedback";

describe("getLoginFeedback", () => {
  it("retorna somente mensagens conhecidas", () => {
    expect(getLoginFeedback("signed-out", undefined)).toEqual({
      kind: "success",
      message: "Sessão encerrada com segurança.",
    });
    expect(getLoginFeedback(undefined, "provider-private-detail")).toBeNull();
  });

  it("prioriza um erro conhecido sobre o aviso", () => {
    expect(getLoginFeedback("signed-out", "oauth")).toMatchObject({
      kind: "error",
    });
  });
});
