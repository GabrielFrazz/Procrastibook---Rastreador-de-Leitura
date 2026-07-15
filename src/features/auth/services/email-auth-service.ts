import type {
  LoginInput,
  SignupInput,
} from "@/features/auth/domain/email-auth-validation";
import type { ActionResult } from "@/lib/actions/action-result";

type AuthCallError = Readonly<{
  code?: string | undefined;
  message?: string | undefined;
}>;
type AuthCallResult = Promise<Readonly<{ error: AuthCallError | null }>>;

export type EmailAuthApi = Readonly<{
  signInWithPassword(credentials: LoginInput): AuthCallResult;
  signUp(credentials: {
    email: string;
    password: string;
    options: { data: { display_name: string }; emailRedirectTo: string };
  }): AuthCallResult;
  resetPasswordForEmail(
    email: string,
    options: { redirectTo: string },
  ): AuthCallResult;
  signOut(options: { scope: "local" }): AuthCallResult;
}>;

type AuthOperation = "login" | "signup" | "recovery" | "logout";

function failure(code: string, message: string): ActionResult<null> {
  return { ok: false, code, message };
}

export function mapAuthError(
  error: AuthCallError,
  operation: AuthOperation,
): ActionResult<null> {
  if (error.code === "invalid_credentials") {
    return failure("INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  }

  if (error.code === "email_not_confirmed") {
    return failure(
      "EMAIL_NOT_CONFIRMED",
      "Confirme seu e-mail antes de entrar.",
    );
  }

  if (error.code === "weak_password") {
    return failure(
      "WEAK_PASSWORD",
      "A senha informada não é forte o suficiente.",
    );
  }

  if (error.code === "signup_disabled") {
    return failure(
      "SIGNUP_DISABLED",
      "Novos cadastros estão temporariamente indisponíveis.",
    );
  }

  if (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit"
  ) {
    return failure(
      "RATE_LIMITED",
      "Muitas tentativas foram feitas. Aguarde um instante e tente novamente.",
    );
  }

  if (operation === "signup" && error.code === "user_already_exists") {
    return { ok: true, data: null };
  }

  return failure(
    "AUTH_UNAVAILABLE",
    "Não foi possível concluir a operação agora. Tente novamente.",
  );
}

async function executeAuthCall(
  operation: AuthOperation,
  call: () => AuthCallResult,
): Promise<ActionResult<null>> {
  try {
    const { error } = await call();
    return error ? mapAuthError(error, operation) : { ok: true, data: null };
  } catch {
    return failure(
      "AUTH_UNAVAILABLE",
      "Não foi possível concluir a operação agora. Tente novamente.",
    );
  }
}

export function signInWithEmail(auth: EmailAuthApi, input: LoginInput) {
  return executeAuthCall("login", () => auth.signInWithPassword(input));
}

export function signUpWithEmail(
  auth: EmailAuthApi,
  input: SignupInput,
  emailRedirectTo: string,
) {
  return executeAuthCall("signup", () =>
    auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { display_name: input.displayName },
        emailRedirectTo,
      },
    }),
  );
}

export function requestPasswordRecovery(
  auth: EmailAuthApi,
  email: string,
  redirectTo: string,
) {
  return executeAuthCall("recovery", () =>
    auth.resetPasswordForEmail(email, { redirectTo }),
  );
}

export function signOutCurrentSession(auth: EmailAuthApi) {
  return executeAuthCall("logout", () => auth.signOut({ scope: "local" }));
}
