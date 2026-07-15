import { type NextRequest, NextResponse } from "next/server";

import { createAuthCallbackUrl } from "@/features/auth/domain/auth-redirects";
import { getSafeNextPath } from "@/features/auth/domain/safe-next-path";
import { beginGoogleOAuth } from "@/features/auth/services/google-oauth-service";
import { isGoogleAuthEnabled } from "@/lib/config/google-auth";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectToLogin(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
}

export async function GET(request: NextRequest) {
  if (!isGoogleAuthEnabled()) {
    return redirectToLogin(request, "google-disabled");
  }

  try {
    const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
    const callbackUrl = createAuthCallbackUrl(nextPath);
    const { url } = getSupabasePublicConfig();
    const supabase = await createServerSupabaseClient();
    const result = await beginGoogleOAuth(supabase.auth, callbackUrl, url);

    return result.ok
      ? NextResponse.redirect(result.data.url)
      : redirectToLogin(request, "oauth");
  } catch {
    return redirectToLogin(request, "oauth");
  }
}
