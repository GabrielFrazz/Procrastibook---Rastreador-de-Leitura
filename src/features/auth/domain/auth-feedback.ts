export type AuthFeedback = Readonly<{
  kind: "error" | "success";
  message: string;
}>;

const LOGIN_NOTICES: Readonly<Record<string, string>> = {
  "signed-out": "Sessão encerrada com segurança.",
};

const LOGIN_ERRORS: Readonly<Record<string, string>> = {
  callback:
    "O link de autenticação é inválido ou expirou. Solicite um novo link.",
  oauth: "Não foi possível entrar com Google agora. Tente novamente.",
  "google-disabled": "A entrada com Google não está disponível neste ambiente.",
};

export function getLoginFeedback(
  notice: string | undefined,
  error: string | undefined,
): AuthFeedback | null {
  if (error && LOGIN_ERRORS[error]) {
    return { kind: "error", message: LOGIN_ERRORS[error] };
  }

  if (notice && LOGIN_NOTICES[notice]) {
    return { kind: "success", message: LOGIN_NOTICES[notice] };
  }

  return null;
}
