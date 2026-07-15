import { type NextRequest, NextResponse } from "next/server";

import { getSafeNextPath } from "@/features/auth/domain/safe-next-path";
import { exchangeAuthCode } from "@/features/auth/services/auth-callback-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function loginErrorResponse(request: NextRequest) {
  return NextResponse.redirect(new URL("/login?error=callback", request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");

  if (!code || providerError) {
    return loginErrorResponse(request);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await exchangeAuthCode(supabase.auth, code);

    if (!result.ok) {
      return loginErrorResponse(request);
    }

    const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch {
    return loginErrorResponse(request);
  }
}
