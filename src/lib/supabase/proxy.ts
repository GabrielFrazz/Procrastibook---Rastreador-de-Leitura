import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getAuthRouteDecision } from "@/features/auth/domain/auth-route";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getAuthCookieOptions } from "@/lib/supabase/cookies";
import type { Database } from "@/lib/supabase/database.types";

const SESSION_RESPONSE_HEADERS = [
  "cache-control",
  "expires",
  "pragma",
] as const;

function copySessionState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));

  SESSION_RESPONSE_HEADERS.forEach((headerName) => {
    const value = source.headers.get(headerName);

    if (value) {
      target.headers.set(headerName, value);
    }
  });
}

export async function updateSupabaseSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            ...getAuthCookieOptions(),
          });
        });

        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const subject = claimsData?.claims.sub;
  const decision = getAuthRouteDecision({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    isAuthenticated: !claimsError && typeof subject === "string",
  });

  if (decision.kind === "allow") {
    return response;
  }

  const redirectResponse = NextResponse.redirect(
    new URL(decision.destination, request.url),
  );
  copySessionState(response, redirectResponse);
  redirectResponse.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );

  return redirectResponse;
}
