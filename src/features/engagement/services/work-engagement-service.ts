import type {
  ManageWorkNoteInput,
  SaveReviewInput,
} from "@/features/engagement/domain/work-engagement";
import type { Database } from "@/lib/supabase/database.types";

type NoteKind = Database["public"]["Enums"]["note_kind"];

type PersistenceResult = Readonly<{ errorCode?: string | undefined }>;

export type WorkEngagementDependencies = Readonly<{
  deleteNote: (
    ownerId: string,
    noteId: string,
    workId: string,
  ) => Promise<boolean>;
  getUserId: () => Promise<string | null>;
  insertNote: (
    input: Readonly<{
      content: string;
      kind: NoteKind;
      locationLabel?: string | undefined;
      ownerId: string;
      sessionId?: string | undefined;
      workId: string;
    }>,
  ) => Promise<PersistenceResult>;
  isOwnedSessionForWork: (
    ownerId: string,
    sessionId: string,
    workId: string,
  ) => Promise<boolean>;
  isOwnedWork: (ownerId: string, workId: string) => Promise<boolean>;
  upsertReview: (
    input: Readonly<{
      body?: string | undefined;
      ownerId: string;
      rating: number;
      workId: string;
    }>,
  ) => Promise<PersistenceResult>;
}>;

export type WorkEngagementResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "INVALID" | "NOT_FOUND" | "UNKNOWN";
      ok: false;
    }>;

function persistenceFailure(code: string | undefined): WorkEngagementResult {
  if (code === "22023" || code === "23514") {
    return { code: "INVALID", ok: false };
  }

  if (code === "23503" || code === "PGRST116") {
    return { code: "NOT_FOUND", ok: false };
  }

  if (code === "42501") {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  return { code: "UNKNOWN", ok: false };
}

async function getOwnerForWork(
  dependencies: WorkEngagementDependencies,
  workId: string,
) {
  const ownerId = await dependencies.getUserId();

  if (!ownerId) {
    return { code: "AUTH_REQUIRED", ok: false } as const;
  }

  if (!(await dependencies.isOwnedWork(ownerId, workId))) {
    return { code: "NOT_FOUND", ok: false } as const;
  }

  return { ok: true, ownerId } as const;
}

export async function saveWorkReview(
  dependencies: WorkEngagementDependencies,
  input: SaveReviewInput,
): Promise<WorkEngagementResult> {
  const ownership = await getOwnerForWork(dependencies, input.workId);

  if (!ownership.ok) {
    return ownership;
  }

  const result = await dependencies.upsertReview({
    ...(input.body ? { body: input.body } : {}),
    ownerId: ownership.ownerId,
    rating: input.rating,
    workId: input.workId,
  });

  return result.errorCode ? persistenceFailure(result.errorCode) : { ok: true };
}

export async function manageWorkNote(
  dependencies: WorkEngagementDependencies,
  input: ManageWorkNoteInput,
): Promise<WorkEngagementResult> {
  const ownership = await getOwnerForWork(dependencies, input.workId);

  if (!ownership.ok) {
    return ownership;
  }

  if (input.intent === "DELETE") {
    return (await dependencies.deleteNote(
      ownership.ownerId,
      input.noteId,
      input.workId,
    ))
      ? { ok: true }
      : { code: "NOT_FOUND", ok: false };
  }

  if (
    input.sessionId &&
    !(await dependencies.isOwnedSessionForWork(
      ownership.ownerId,
      input.sessionId,
      input.workId,
    ))
  ) {
    return { code: "INVALID", ok: false };
  }

  const result = await dependencies.insertNote({
    content: input.content,
    kind: input.kind,
    ...(input.locationLabel ? { locationLabel: input.locationLabel } : {}),
    ownerId: ownership.ownerId,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    workId: input.workId,
  });

  return result.errorCode ? persistenceFailure(result.errorCode) : { ok: true };
}
