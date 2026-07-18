import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CurrentProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "avatar_path" | "timezone"
> &
  Readonly<{ email: string }>;

export class CurrentProfileQueryError extends Error {
  constructor() {
    super("Não foi possível carregar o perfil atual.");
    this.name = "CurrentProfileQueryError";
  }
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const subject = claimsData?.claims.sub;
  const email = claimsData?.claims.email;

  if (claimsError || typeof subject !== "string") {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_path, timezone")
    .eq("id", subject)
    .maybeSingle();

  if (profileError) {
    throw new CurrentProfileQueryError();
  }

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    email: typeof email === "string" ? email : "",
  };
}
