import { type NextRequest } from "next/server";

import { FixedWindowRateLimiter } from "@/features/catalog/server/catalog-rate-limiter";
import { handleCatalogSearchRequest } from "@/features/catalog/server/catalog-route-handler";
import { searchCachedCatalog } from "@/features/catalog/server/cached-catalog-search";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const rateLimiter = new FixedWindowRateLimiter({
  limit: 20,
  windowMs: 60_000,
});

async function getUserId() {
  const supabase = await createServerSupabaseClient();
  const result = await supabase.auth.getUser();
  return result.error ? null : (result.data.user?.id ?? null);
}

export async function GET(request: NextRequest) {
  return handleCatalogSearchRequest(request, {
    consumeRateLimit: (userId) => rateLimiter.consume(userId),
    getUserId,
    search: searchCachedCatalog,
  });
}
