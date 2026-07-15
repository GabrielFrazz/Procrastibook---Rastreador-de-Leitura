import { createBrowserClient } from "@supabase/ssr";

import { getAuthCookieOptions } from "@/lib/supabase/cookies";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig();

  return createBrowserClient<Database>(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(),
  });
}
