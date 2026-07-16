import type { ProfileSettingsInput } from "@/features/profile/domain/profile-settings";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

const avatarExtensions: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UpdateProfileResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "UPLOAD_FAILED" | "UNKNOWN";
      ok: false;
    }>;

export async function updateCurrentProfile(
  supabase: ServerSupabaseClient,
  input: ProfileSettingsInput,
): Promise<UpdateProfileResult> {
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;

  if (userResult.error || !user) {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  const currentResult = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (currentResult.error || !currentResult.data) {
    return { code: "UNKNOWN", ok: false };
  }

  let nextAvatarPath = input.removeAvatar
    ? null
    : currentResult.data.avatar_path;
  let uploadedPath: string | null = null;

  if (input.avatarFile) {
    const extension = avatarExtensions[input.avatarFile.type];

    if (!extension) {
      return { code: "UPLOAD_FAILED", ok: false };
    }

    uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const uploadResult = await supabase.storage
      .from("avatars")
      .upload(
        uploadedPath,
        new Uint8Array(await input.avatarFile.arrayBuffer()),
        {
          cacheControl: "3600",
          contentType: input.avatarFile.type,
          upsert: false,
        },
      );

    if (uploadResult.error) {
      return { code: "UPLOAD_FAILED", ok: false };
    }

    nextAvatarPath = uploadedPath;
  }

  const updateResult = await supabase
    .from("profiles")
    .update({
      avatar_path: nextAvatarPath,
      display_name: input.displayName,
      timezone: input.timezone,
    })
    .eq("id", user.id);

  if (updateResult.error) {
    if (uploadedPath) {
      await supabase.storage.from("avatars").remove([uploadedPath]);
    }
    return { code: "UNKNOWN", ok: false };
  }

  const previousPath = currentResult.data.avatar_path;
  if (previousPath && previousPath !== nextAvatarPath) {
    await supabase.storage.from("avatars").remove([previousPath]);
  }

  return { ok: true };
}
