import { describe, expect, it, vi } from "vitest";

import {
  createReadingSession,
  type CreateReadingSessionDependencies,
} from "@/features/reading/services/create-reading-session-service";

const input = {
  durationSeconds: 2_700,
  endPosition: 42,
  notes: "Boa sessão.",
  occurredOn: "2026-07-15",
  workId: "10000000-0000-4000-8000-000000000001",
} as const;

function dependencies(
  overrides: Partial<CreateReadingSessionDependencies> = {},
): CreateReadingSessionDependencies {
  return {
    getUserId: async () => "user-a",
    recordSession: async () => ({}),
    ...overrides,
  };
}

describe("createReadingSession", () => {
  it("exige usuário autenticado antes de registrar", async () => {
    const recordSession =
      vi.fn<CreateReadingSessionDependencies["recordSession"]>();

    await expect(
      createReadingSession(
        dependencies({ getUserId: async () => null, recordSession }),
        input,
      ),
    ).resolves.toEqual({ code: "AUTH_REQUIRED", ok: false });
    expect(recordSession).not.toHaveBeenCalled();
  });

  it("envia somente a posição final para a operação atômica", async () => {
    const recordSession = vi.fn<
      CreateReadingSessionDependencies["recordSession"]
    >(async () => ({}));

    await expect(
      createReadingSession(dependencies({ recordSession }), input),
    ).resolves.toEqual({ ok: true });
    expect(recordSession).toHaveBeenCalledWith({
      durationSeconds: 2_700,
      endPosition: 42,
      notes: "Boa sessão.",
      occurredOn: "2026-07-15",
      workId: input.workId,
    });
  });

  it.each([
    ["23514", "INVALID"],
    ["23503", "NOT_FOUND"],
    ["P0002", "NOT_FOUND"],
    ["42501", "AUTH_REQUIRED"],
    ["XX000", "UNKNOWN"],
  ] as const)("normaliza a falha %s como %s", async (errorCode, code) => {
    await expect(
      createReadingSession(
        dependencies({ recordSession: async () => ({ errorCode }) }),
        input,
      ),
    ).resolves.toEqual({ code, ok: false });
  });
});
