import { getCurrentProfile } from "@/features/auth/data/current-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileSettingsData = Readonly<{
  avatarPath: string | null;
  avatarUrl: string | null;
  displayName: string;
  email: string;
  id: string;
  timezone: string;
}>;

export async function getProfileSettingsData(): Promise<ProfileSettingsData | null> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  let avatarUrl: string | null = null;

  if (profile.avatar_path) {
    const supabase = await createServerSupabaseClient();
    const signedAvatar = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60);

    if (!signedAvatar.error) {
      avatarUrl = signedAvatar.data.signedUrl;
    }
  }

  return {
    avatarPath: profile.avatar_path,
    avatarUrl,
    displayName: profile.display_name,
    email: profile.email,
    id: profile.id,
    timezone: profile.timezone,
  };
}
