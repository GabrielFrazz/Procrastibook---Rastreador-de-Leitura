import {
  calculateReadingStatistics,
  type ReadingStatistics,
} from "@/features/statistics/domain/reading-statistics";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class ReadingStatisticsQueryError extends Error {
  constructor() {
    super("Não foi possível carregar as estatísticas.");
    this.name = "ReadingStatisticsQueryError";
  }
}

export async function getReadingStatistics({
  now = new Date(),
  timezone,
}: Readonly<{ now?: Date; timezone: string }>): Promise<ReadingStatistics> {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();
  const ownerId = userResult.data.user?.id;

  if (userResult.error || !ownerId) {
    throw new ReadingStatisticsQueryError();
  }

  const [worksResult, progressResult, sessionsResult, reviewsResult] =
    await Promise.all([
      supabase
        .from("works")
        .select("id, title, status, progress_unit, finished_at")
        .eq("owner_id", ownerId),
      supabase
        .from("progress_events")
        .select("work_id, event_type, previous_value, new_value, recorded_at")
        .eq("owner_id", ownerId),
      supabase
        .from("reading_sessions")
        .select(
          "work_id, occurred_on, duration_seconds, progress_unit, start_position, end_position",
        )
        .eq("owner_id", ownerId),
      supabase.from("reviews").select("rating").eq("owner_id", ownerId),
    ]);

  if (
    worksResult.error ||
    progressResult.error ||
    sessionsResult.error ||
    reviewsResult.error
  ) {
    throw new ReadingStatisticsQueryError();
  }

  return calculateReadingStatistics(
    {
      progressEvents: progressResult.data.map((event) => ({
        eventType: event.event_type,
        newValue: event.new_value,
        previousValue: event.previous_value,
        recordedAt: event.recorded_at,
        workId: event.work_id,
      })),
      reviews: reviewsResult.data,
      sessions: sessionsResult.data.map((session) => ({
        durationSeconds: session.duration_seconds,
        endPosition: session.end_position,
        occurredOn: session.occurred_on,
        progressUnit: session.progress_unit,
        startPosition: session.start_position,
        workId: session.work_id,
      })),
      works: worksResult.data.map((work) => ({
        finishedAt: work.finished_at,
        id: work.id,
        progressUnit: work.progress_unit,
        status: work.status,
        title: work.title,
      })),
    },
    { now, timezone },
  );
}
