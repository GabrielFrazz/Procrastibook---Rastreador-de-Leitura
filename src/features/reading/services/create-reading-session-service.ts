import type { CreateReadingSessionInput } from "@/features/reading/domain/reading-sessions";
import type { Database } from "@/lib/supabase/database.types";

type ProgressUnit = Database["public"]["Enums"]["progress_unit"];

export type ReadingSessionInsert = Readonly<{
  durationSeconds: number;
  endPosition: number | null;
  notes?: string | undefined;
  occurredOn: string;
  ownerId: string;
  progressUnit: ProgressUnit;
  startPosition: number | null;
  workId: string;
}>;

export type CreateReadingSessionDependencies = Readonly<{
  findOwnedWorkUnit: (
    ownerId: string,
    workId: string,
  ) => Promise<ProgressUnit | null>;
  getUserId: () => Promise<string | null>;
  insertSession: (
    session: ReadingSessionInsert,
  ) => Promise<{ errorCode?: string | undefined }>;
}>;

export type CreateReadingSessionResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "INVALID" | "NOT_FOUND" | "UNKNOWN";
      ok: false;
    }>;

function mapFailure(code: string | undefined): CreateReadingSessionResult {
  if (code === "22023" || code === "23514") {
    return { code: "INVALID", ok: false };
  }

  if (code === "23503") {
    return { code: "NOT_FOUND", ok: false };
  }

  if (code === "42501") {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  return { code: "UNKNOWN", ok: false };
}

export async function createReadingSession(
  dependencies: CreateReadingSessionDependencies,
  input: CreateReadingSessionInput,
): Promise<CreateReadingSessionResult> {
  const ownerId = await dependencies.getUserId();

  if (!ownerId) {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  const progressUnit = await dependencies.findOwnedWorkUnit(
    ownerId,
    input.workId,
  );

  if (!progressUnit) {
    return { code: "NOT_FOUND", ok: false };
  }

  const result = await dependencies.insertSession({
    durationSeconds: input.durationSeconds,
    endPosition: input.endPosition,
    ...(input.notes ? { notes: input.notes } : {}),
    occurredOn: input.occurredOn,
    ownerId,
    progressUnit,
    startPosition: input.startPosition,
    workId: input.workId,
  });

  return result.errorCode ? mapFailure(result.errorCode) : { ok: true };
}
