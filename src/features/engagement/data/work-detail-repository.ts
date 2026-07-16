import type { WorkDetailData } from "@/features/engagement/domain/work-engagement";
import type { WorkEngagementDependencies } from "@/features/engagement/services/work-engagement-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export class WorkDetailQueryError extends Error {
  constructor() {
    super("Não foi possível carregar os detalhes da obra.");
    this.name = "WorkDetailQueryError";
  }
}

export function createWorkEngagementDependencies(
  supabase: ServerSupabaseClient,
): WorkEngagementDependencies {
  return {
    deleteNote: async (ownerId, noteId, workId) => {
      const result = await supabase
        .from("notes")
        .delete()
        .eq("owner_id", ownerId)
        .eq("work_id", workId)
        .eq("id", noteId)
        .select("id");
      return !result.error && result.data.length === 1;
    },
    getUserId: async () => {
      const result = await supabase.auth.getUser();
      return result.error ? null : (result.data.user?.id ?? null);
    },
    insertNote: async (input) => {
      const result = await supabase.from("notes").insert({
        content: input.content,
        kind: input.kind,
        location_label: input.locationLabel ?? null,
        owner_id: input.ownerId,
        session_id: input.sessionId ?? null,
        work_id: input.workId,
      });
      return result.error ? { errorCode: result.error.code } : {};
    },
    isOwnedSessionForWork: async (ownerId, sessionId, workId) => {
      const result = await supabase
        .from("reading_sessions")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("work_id", workId)
        .eq("id", sessionId)
        .maybeSingle();
      return !result.error && Boolean(result.data);
    },
    isOwnedWork: async (ownerId, workId) => {
      const result = await supabase
        .from("works")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("id", workId)
        .maybeSingle();
      return !result.error && Boolean(result.data);
    },
    upsertReview: async (input) => {
      const result = await supabase.from("reviews").upsert(
        {
          body: input.body ?? null,
          owner_id: input.ownerId,
          rating: input.rating,
          work_id: input.workId,
        },
        { onConflict: "owner_id,work_id" },
      );
      return result.error ? { errorCode: result.error.code } : {};
    },
  };
}

export async function getWorkDetailData(
  workId: string,
): Promise<WorkDetailData | null> {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();
  const ownerId = userResult.data.user?.id;

  if (userResult.error || !ownerId) {
    throw new WorkDetailQueryError();
  }

  const workResult = await supabase
    .from("works")
    .select(
      "id, type, title, subtitle, description, publisher, published_year, language, isbn_10, isbn_13, doi, page_count, chapter_count, progress_unit, current_progress, status, cover_external_url",
    )
    .eq("owner_id", ownerId)
    .eq("id", workId)
    .maybeSingle();

  if (workResult.error) {
    throw new WorkDetailQueryError();
  }

  if (!workResult.data) {
    return null;
  }

  const [
    contributorsResult,
    linksResult,
    genresResult,
    reviewResult,
    notesResult,
    sessionsResult,
  ] = await Promise.all([
    supabase.from("contributors").select("id, name").eq("owner_id", ownerId),
    supabase
      .from("work_contributors")
      .select("contributor_id, role, position")
      .eq("owner_id", ownerId)
      .eq("work_id", workId)
      .order("position"),
    supabase
      .from("work_genres")
      .select("genre")
      .eq("owner_id", ownerId)
      .eq("work_id", workId),
    supabase
      .from("reviews")
      .select("rating, body, updated_at")
      .eq("owner_id", ownerId)
      .eq("work_id", workId)
      .maybeSingle(),
    supabase
      .from("notes")
      .select("id, kind, content, location_label, session_id, created_at")
      .eq("owner_id", ownerId)
      .eq("work_id", workId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reading_sessions")
      .select("id, occurred_on")
      .eq("owner_id", ownerId)
      .eq("work_id", workId)
      .order("occurred_on", { ascending: false }),
  ]);

  if (
    contributorsResult.error ||
    linksResult.error ||
    genresResult.error ||
    reviewResult.error ||
    notesResult.error ||
    sessionsResult.error
  ) {
    throw new WorkDetailQueryError();
  }

  const contributorById = new Map(
    contributorsResult.data.map((contributor) => [
      contributor.id,
      contributor.name,
    ]),
  );
  const sessionDateById = new Map(
    sessionsResult.data.map((session) => [session.id, session.occurred_on]),
  );
  const work = workResult.data;

  return {
    notes: notesResult.data.map((note) => ({
      content: note.content,
      createdAt: note.created_at,
      id: note.id,
      kind: note.kind,
      locationLabel: note.location_label,
      sessionOccurredOn: note.session_id
        ? (sessionDateById.get(note.session_id) ?? null)
        : null,
    })),
    review: reviewResult.data
      ? {
          body: reviewResult.data.body,
          rating: reviewResult.data.rating,
          updatedAt: reviewResult.data.updated_at,
        }
      : null,
    sessions: sessionsResult.data.map((session) => ({
      id: session.id,
      occurredOn: session.occurred_on,
    })),
    work: {
      authors: linksResult.data
        .filter((link) => link.role === "AUTHOR")
        .map((link) => contributorById.get(link.contributor_id))
        .filter((author): author is string => Boolean(author)),
      chapterCount: work.chapter_count,
      coverUrl: work.cover_external_url,
      currentProgress: work.current_progress,
      description: work.description,
      doi: work.doi,
      genres: genresResult.data.map((genre) => genre.genre),
      id: work.id,
      identifiers: [work.isbn_13, work.isbn_10, work.doi].filter(
        (identifier): identifier is string => Boolean(identifier),
      ),
      isbn10: work.isbn_10,
      isbn13: work.isbn_13,
      language: work.language,
      pageCount: work.page_count,
      progressUnit: work.progress_unit,
      publishedYear: work.published_year,
      publisher: work.publisher,
      status: work.status,
      subtitle: work.subtitle,
      title: work.title,
      type: work.type,
    },
  };
}
