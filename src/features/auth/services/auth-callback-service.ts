import type { ActionResult } from "@/lib/actions/action-result";

type AuthCallError = Readonly<{
  code?: string | undefined;
  message?: string | undefined;
}>;

export type AuthCodeExchangeApi = Readonly<{
  exchangeCodeForSession(
    code: string,
  ): Promise<Readonly<{ error: AuthCallError | null }>>;
}>;

export async function exchangeAuthCode(
  auth: AuthCodeExchangeApi,
  code: string,
): Promise<ActionResult<null>> {
  if (!code) {
    return {
      ok: false,
      code: "INVALID_CALLBACK",
      message: "O link de autenticação é inválido ou expirou.",
    };
  }

  try {
    const { error } = await auth.exchangeCodeForSession(code);

    return error
      ? {
          ok: false,
          code: "INVALID_CALLBACK",
          message: "O link de autenticação é inválido ou expirou.",
        }
      : { ok: true, data: null };
  } catch {
    return {
      ok: false,
      code: "AUTH_UNAVAILABLE",
      message: "Não foi possível concluir a autenticação agora.",
    };
  }
}
