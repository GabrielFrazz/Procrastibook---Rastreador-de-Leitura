import type { ManualWorkInput } from "@/features/works/domain/work-form";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export type CreateWorkResult =
  | Readonly<{ id: string; ok: true }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "COVER_UPLOAD_FAILED" | "DUPLICATE" | "UNKNOWN";
      ok: false;
    }>;

const coverExtensions: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function createManualWork(
  supabase: ServerSupabaseClient,
  input: ManualWorkInput,
): Promise<CreateWorkResult> {
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;

  if (userResult.error || !user) {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  let coverPath: string | undefined;

  if (input.coverFile) {
    const extension = coverExtensions[input.coverFile.type];

    if (!extension) {
      return { code: "COVER_UPLOAD_FAILED", ok: false };
    }

    coverPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const uploadResult = await supabase.storage
      .from("covers")
      .upload(coverPath, new Uint8Array(await input.coverFile.arrayBuffer()), {
        cacheControl: "3600",
        contentType: input.coverFile.type,
        upsert: false,
      });

    if (uploadResult.error) {
      return { code: "COVER_UPLOAD_FAILED", ok: false };
    }
  }

  const createResult = await supabase.rpc("create_manual_work", {
    p_authors: [...input.authors],
    p_progress_unit: input.progressUnit,
    p_status: input.status,
    p_title: input.title,
    p_type: input.type,
    ...(input.chapterCount ? { p_chapter_count: input.chapterCount } : {}),
    ...(coverPath ? { p_cover_path: coverPath } : {}),
    ...(input.description ? { p_description: input.description } : {}),
    ...(input.genres.length > 0 ? { p_genres: [...input.genres] } : {}),
    ...(input.isbn13 ? { p_isbn_13: input.isbn13 } : {}),
    ...(input.language ? { p_language: input.language } : {}),
    ...(input.pageCount ? { p_page_count: input.pageCount } : {}),
    ...(input.publishedYear ? { p_published_year: input.publishedYear } : {}),
    ...(input.publisher ? { p_publisher: input.publisher } : {}),
    ...(input.startedAt ? { p_started_at: input.startedAt } : {}),
    ...(input.subtitle ? { p_subtitle: input.subtitle } : {}),
  });

  if (createResult.error) {
    if (coverPath) {
      await supabase.storage.from("covers").remove([coverPath]);
    }

    return {
      code: createResult.error.code === "23505" ? "DUPLICATE" : "UNKNOWN",
      ok: false,
    };
  }

  return { id: createResult.data, ok: true };
}
