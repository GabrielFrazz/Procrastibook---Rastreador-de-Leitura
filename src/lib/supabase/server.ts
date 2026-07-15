import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getAuthCookieOptions } from "@/lib/supabase/cookies";
import type { Database } from "@/lib/supabase/database.types";

export async function createServerSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...getAuthCookieOptions(),
            });
          });
        } catch {
          // Server Components cannot write cookies. The request proxy performs
          // the refresh and persists the updated session before rendering.
        }
      },
    },
  });
}
