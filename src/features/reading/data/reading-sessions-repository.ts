import {
  summarizeReadingSessions,
  type ReadingSessionItem,
  type ReadingSessionsData,
  type ReadingSessionWork,
} from "@/features/reading/domain/reading-sessions";
import type { CreateReadingSessionDependencies } from "@/features/reading/services/create-reading-session-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export class ReadingSessionsQueryError extends Error {
  constructor() {
    super("Não foi possível carregar as sessões de leitura.");
    this.name = "ReadingSessionsQueryError";
  }
}

export function createReadingSessionDependencies(
  supabase: ServerSupabaseClient,
): CreateReadingSessionDependencies {
  return {
    getUserId: async () => {
      const result = await supabase.auth.getUser();
      return result.error ? null : (result.data.user?.id ?? null);
    },
    recordSession: async (session) => {
      const result = await supabase.rpc("record_reading_session", {
        p_duration_seconds: session.durationSeconds,
        p_end_position: session.endPosition,
        ...(session.notes ? { p_notes: session.notes } : {}),
        p_occurred_on: session.occurredOn,
        p_work_id: session.workId,
      });

      return result.error ? { errorCode: result.error.code } : {};
    },
  };
}

function getWorkTotal(
  work: Readonly<{
    chapter_count: number | null;
    page_count: number | null;
    progress_unit: "CHAPTER" | "PAGE" | "PERCENT";
  }>,
) {
  if (work.progress_unit === "PERCENT") {
    return 100;
  }

  return work.progress_unit === "PAGE" ? work.page_count : work.chapter_count;
}

export async function getReadingSessionsData(): Promise<ReadingSessionsData> {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();
  const ownerId = userResult.data.user?.id;

  if (userResult.error || !ownerId) {
    throw new ReadingSessionsQueryError();
  }

  const [worksResult, sessionsResult] = await Promise.all([
    supabase
      .from("works")
      .select(
        "id, title, progress_unit, current_progress, page_count, chapter_count",
      )
      .eq("owner_id", ownerId)
      .order("title"),
    supabase
      .from("reading_sessions")
      .select(
        "id, work_id, occurred_on, duration_seconds, progress_unit, start_position, end_position, notes, created_at",
      )
      .eq("owner_id", ownerId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (worksResult.error || sessionsResult.error) {
    throw new ReadingSessionsQueryError();
  }

  const works: ReadingSessionWork[] = worksResult.data.map((work) => ({
    currentProgress: work.current_progress,
    id: work.id,
    progressUnit: work.progress_unit,
    title: work.title,
    totalProgress: getWorkTotal(work),
  }));
  const workById = new Map(works.map((work) => [work.id, work]));
  const sessions: ReadingSessionItem[] = sessionsResult.data.map((session) => ({
    createdAt: session.created_at,
    durationSeconds: session.duration_seconds,
    endPosition: session.end_position,
    id: session.id,
    notes: session.notes,
    occurredOn: session.occurred_on,
    progressUnit: session.progress_unit,
    startPosition: session.start_position,
    workId: session.work_id,
    workTitle: workById.get(session.work_id)?.title ?? "Obra removida",
  }));

  return { sessions, summary: summarizeReadingSessions(sessions), works };
}
