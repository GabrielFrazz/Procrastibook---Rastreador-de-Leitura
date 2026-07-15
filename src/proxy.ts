import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/library/:path*",
    "/sessions/:path*",
    "/goals/:path*",
    "/statistics/:path*",
    "/lists/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/update-password",
    "/auth/callback",
  ],
};
