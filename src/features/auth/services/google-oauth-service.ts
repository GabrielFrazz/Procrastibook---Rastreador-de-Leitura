import type { ActionResult } from "@/lib/actions/action-result";

type OAuthError = Readonly<{
  code?: string | undefined;
  message?: string | undefined;
}>;

type OAuthResponse = Readonly<{
  data: Readonly<{ url: string | null }>;
  error: OAuthError | null;
}>;

export type GoogleOAuthApi = Readonly<{
  signInWithOAuth(credentials: {
    provider: "google";
    options: { redirectTo: string; skipBrowserRedirect: true };
  }): Promise<OAuthResponse>;
}>;

function isTrustedAuthorizationUrl(value: string, supabaseUrl: string) {
  try {
    const authorizationUrl = new URL(value);
    const expectedOrigin = new URL(supabaseUrl).origin;

    return (
      authorizationUrl.origin === expectedOrigin &&
      authorizationUrl.pathname === "/auth/v1/authorize"
    );
  } catch {
    return false;
  }
}

export async function beginGoogleOAuth(
  auth: GoogleOAuthApi,
  callbackUrl: string,
  supabaseUrl: string,
): Promise<ActionResult<Readonly<{ url: string }>>> {
  try {
    const { data, error } = await auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl, skipBrowserRedirect: true },
    });

    if (
      error ||
      !data.url ||
      !isTrustedAuthorizationUrl(data.url, supabaseUrl)
    ) {
      return {
        ok: false,
        code: "OAUTH_UNAVAILABLE",
        message: "Não foi possível iniciar a entrada com Google agora.",
      };
    }

    return { ok: true, data: { url: data.url } };
  } catch {
    return {
      ok: false,
      code: "OAUTH_UNAVAILABLE",
      message: "Não foi possível iniciar a entrada com Google agora.",
    };
  }
}
