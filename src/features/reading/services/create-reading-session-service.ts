import type { CreateReadingSessionInput } from "@/features/reading/domain/reading-sessions";
export type ReadingSessionCommand = Readonly<{
  durationSeconds: number;
  endPosition: number;
  notes?: string | undefined;
  occurredOn: string;
  workId: string;
}>;

export type CreateReadingSessionDependencies = Readonly<{
  getUserId: () => Promise<string | null>;
  recordSession: (
    session: ReadingSessionCommand,
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

  if (code === "23503" || code === "P0002") {
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

  const result = await dependencies.recordSession({
    durationSeconds: input.durationSeconds,
    endPosition: input.endPosition,
    ...(input.notes ? { notes: input.notes } : {}),
    occurredOn: input.occurredOn,
    workId: input.workId,
  });

  return result.errorCode ? mapFailure(result.errorCode) : { ok: true };
}
