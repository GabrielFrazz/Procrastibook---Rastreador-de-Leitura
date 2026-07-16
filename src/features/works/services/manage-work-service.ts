import type { UpdateOwnedWorkInput } from "@/features/works/domain/work-management";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export type ManageWorkResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "DUPLICATE" | "INVALID" | "NOT_FOUND" | "UNKNOWN";
      ok: false;
    }>;

export async function updateOwnedWork(
  supabase: ServerSupabaseClient,
  input: UpdateOwnedWorkInput,
): Promise<ManageWorkResult> {
  const result = await supabase.rpc("update_owned_work", {
    p_authors: [...input.authors],
    p_genres: [...input.genres],
    p_status: input.status,
    p_title: input.title,
    p_type: input.type,
    p_work_id: input.workId,
    ...(input.chapterCount ? { p_chapter_count: input.chapterCount } : {}),
    ...(input.description ? { p_description: input.description } : {}),
    ...(input.doi ? { p_doi: input.doi } : {}),
    ...(input.isbn10 ? { p_isbn_10: input.isbn10 } : {}),
    ...(input.isbn13 ? { p_isbn_13: input.isbn13 } : {}),
    ...(input.language ? { p_language: input.language } : {}),
    ...(input.pageCount ? { p_page_count: input.pageCount } : {}),
    ...(input.publishedYear ? { p_published_year: input.publishedYear } : {}),
    ...(input.publisher ? { p_publisher: input.publisher } : {}),
    ...(input.subtitle ? { p_subtitle: input.subtitle } : {}),
  });

  if (!result.error) {
    return { ok: true };
  }

  if (result.error.code === "23505") {
    return { code: "DUPLICATE", ok: false };
  }

  if (result.error.code === "22023" || result.error.code === "23514") {
    return { code: "INVALID", ok: false };
  }

  if (result.error.code === "42501") {
    return { code: "NOT_FOUND", ok: false };
  }

  return { code: "UNKNOWN", ok: false };
}

export async function deleteOwnedWork(
  supabase: ServerSupabaseClient,
  workId: string,
): Promise<ManageWorkResult> {
  const result = await supabase.rpc("delete_owned_work", { p_work_id: workId });

  if (result.error) {
    return {
      code: result.error.code === "42501" ? "NOT_FOUND" : "UNKNOWN",
      ok: false,
    };
  }

  if (result.data) {
    await supabase.storage.from("covers").remove([result.data]);
  }

  return { ok: true };
}
