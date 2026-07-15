import type { AuthFieldErrors } from "@/features/auth/domain/email-auth-validation";
import type { ActionResult } from "@/lib/actions/action-result";

export type AuthFormState = Readonly<{
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: AuthFieldErrors;
}>;

export const INITIAL_AUTH_FORM_STATE: AuthFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export function createValidationErrorState(
  fieldErrors: AuthFieldErrors,
): AuthFormState {
  return {
    status: "error",
    message: "Revise os campos destacados.",
    fieldErrors,
  };
}

export function createAuthErrorState(
  result: Extract<ActionResult<unknown>, { ok: false }>,
): AuthFormState {
  return {
    status: "error",
    message: result.message,
    fieldErrors: {},
  };
}

export function createAuthSuccessState(message: string): AuthFormState {
  return { status: "success", message, fieldErrors: {} };
}

export function createAuthUnavailableState(): AuthFormState {
  return {
    status: "error",
    message:
      "Não foi possível acessar o serviço de autenticação. Tente novamente.",
    fieldErrors: {},
  };
}
