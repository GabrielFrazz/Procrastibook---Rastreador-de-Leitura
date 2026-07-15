import { calculateDashboardSummary } from "@/features/dashboard/domain/dashboard-summary";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class DashboardQueryError extends Error {
  constructor() {
    super("Não foi possível carregar o resumo de leitura.");
    this.name = "DashboardQueryError";
  }
}

export async function getDashboardSummary(timezone = "America/Sao_Paulo") {
  const supabase = await createServerSupabaseClient();
  const [
    worksResult,
    progressResult,
    sessionsResult,
    reviewsResult,
    goalsResult,
  ] = await Promise.all([
    supabase
      .from("works")
      .select(
        "id, title, type, status, progress_unit, current_progress, page_count, chapter_count, finished_at, updated_at",
      ),
    supabase
      .from("progress_events")
      .select(
        "id, work_id, event_type, previous_value, new_value, recorded_at",
      ),
    supabase
      .from("reading_sessions")
      .select(
        "id, work_id, occurred_on, duration_seconds, progress_unit, start_position, end_position",
      ),
    supabase.from("reviews").select("id, work_id, rating, updated_at"),
    supabase
      .from("goals")
      .select("id, metric, target_value, period_start, period_end"),
  ]);

  if (
    worksResult.error ||
    progressResult.error ||
    sessionsResult.error ||
    reviewsResult.error ||
    goalsResult.error
  ) {
    throw new DashboardQueryError();
  }

  return calculateDashboardSummary(
    {
      works: worksResult.data,
      progressEvents: progressResult.data,
      sessions: sessionsResult.data,
      reviews: reviewsResult.data,
      goals: goalsResult.data,
    },
    { timezone },
  );
}
