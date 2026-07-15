import type { ManageReadingListInput } from "@/features/lists/domain/reading-lists";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export type ReadingListCommandResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "DUPLICATE" | "NOT_FOUND" | "UNKNOWN";
      ok: false;
    }>;

function failure(code: string | undefined): ReadingListCommandResult {
  if (code === "23505") {
    return { code: "DUPLICATE", ok: false };
  }

  if (code === "42501") {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  return { code: "UNKNOWN", ok: false };
}

export async function createReadingList(
  supabase: ServerSupabaseClient,
  input: Readonly<{ description?: string | undefined; name: string }>,
): Promise<ReadingListCommandResult> {
  const result = await supabase.rpc("create_reading_list", {
    p_name: input.name,
    ...(input.description ? { p_description: input.description } : {}),
  });

  return result.error ? failure(result.error.code) : { ok: true };
}

export async function manageReadingList(
  supabase: ServerSupabaseClient,
  input: ManageReadingListInput,
): Promise<ReadingListCommandResult> {
  if (input.intent === "ADD_ITEM") {
    const result = await supabase.rpc("add_work_to_reading_list", {
      p_list_id: input.listId,
      p_work_id: input.workId,
    });
    return result.error ? failure(result.error.code) : { ok: true };
  }

  if (input.intent === "REMOVE_ITEM") {
    const result = await supabase.rpc("remove_work_from_reading_list", {
      p_list_id: input.listId,
      p_work_id: input.workId,
    });

    if (result.error) {
      return failure(result.error.code);
    }

    return result.data ? { ok: true } : { code: "NOT_FOUND", ok: false };
  }

  const result = await supabase.rpc("delete_reading_list", {
    p_list_id: input.listId,
  });

  if (result.error) {
    return failure(result.error.code);
  }

  return result.data ? { ok: true } : { code: "NOT_FOUND", ok: false };
}
