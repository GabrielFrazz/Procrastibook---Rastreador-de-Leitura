import {
  PROGRESS_HISTORY_PAGE_SIZE,
  type ProgressHistoryPage,
  type ProgressHistoryQuery,
} from "@/features/progress/domain/progress-history";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export class ProgressHistoryQueryError extends Error {
  constructor() {
    super("Não foi possível carregar o histórico de progresso.");
    this.name = "ProgressHistoryQueryError";
  }
}

export async function getProgressHistoryPage(
  supabase: ServerSupabaseClient,
  userId: string,
  query: ProgressHistoryQuery,
): Promise<ProgressHistoryPage> {
  const offset = query.page * PROGRESS_HISTORY_PAGE_SIZE;
  const result = await supabase
    .from("progress_events")
    .select("id, event_type, previous_value, new_value, recorded_at", {
      count: "exact",
    })
    .eq("owner_id", userId)
    .eq("work_id", query.workId)
    .order("recorded_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + PROGRESS_HISTORY_PAGE_SIZE - 1);

  if (result.error) {
    throw new ProgressHistoryQueryError();
  }

  const total = result.count ?? result.data.length;

  return {
    items: result.data.map((event) => ({
      eventType: event.event_type,
      id: event.id,
      newValue: event.new_value,
      previousValue: event.previous_value,
      recordedAt: event.recorded_at,
    })),
    nextPage: offset + result.data.length < total ? query.page + 1 : null,
    total,
  };
}
