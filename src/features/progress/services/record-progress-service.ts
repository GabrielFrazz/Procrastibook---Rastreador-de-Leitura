import type { RecordProgressInput } from "@/features/progress/domain/progress-form";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export type RecordProgressResult =
  | Readonly<{ ok: true; value: number }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "CONFLICT" | "INVALID" | "UNKNOWN";
      ok: false;
    }>;

function failure(code: string | undefined): RecordProgressResult {
  if (code === "40001") {
    return { code: "CONFLICT", ok: false };
  }

  if (code === "22023" || code === "23514") {
    return { code: "INVALID", ok: false };
  }

  if (code === "42501") {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  return { code: "UNKNOWN", ok: false };
}

export async function recordProgress(
  supabase: ServerSupabaseClient,
  input: RecordProgressInput,
): Promise<RecordProgressResult> {
  const result = await supabase.rpc("record_work_progress", {
    p_event_type: input.eventType,
    p_expected_previous_value: input.expectedPreviousValue,
    p_new_value: input.newValue,
    p_work_id: input.workId,
  });

  return result.error
    ? failure(result.error.code)
    : { ok: true, value: result.data };
}
