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
  startPosition: 12,
  workId: "10000000-0000-4000-8000-000000000001",
} as const;

function dependencies(
  overrides: Partial<CreateReadingSessionDependencies> = {},
): CreateReadingSessionDependencies {
  return {
    findOwnedWorkUnit: async () => "PAGE",
    getUserId: async () => "user-a",
    insertSession: async () => ({}),
    ...overrides,
  };
}

describe("createReadingSession", () => {
  it("exige usuário autenticado antes de consultar a obra", async () => {
    const findOwnedWorkUnit =
      vi.fn<CreateReadingSessionDependencies["findOwnedWorkUnit"]>();

    await expect(
      createReadingSession(
        dependencies({ findOwnedWorkUnit, getUserId: async () => null }),
        input,
      ),
    ).resolves.toEqual({ code: "AUTH_REQUIRED", ok: false });
    expect(findOwnedWorkUnit).not.toHaveBeenCalled();
  });

  it("impede sessão para uma obra ausente ou de outro usuário", async () => {
    const insertSession =
      vi.fn<CreateReadingSessionDependencies["insertSession"]>();

    await expect(
      createReadingSession(
        dependencies({
          findOwnedWorkUnit: async () => null,
          insertSession,
        }),
        input,
      ),
    ).resolves.toEqual({ code: "NOT_FOUND", ok: false });
    expect(insertSession).not.toHaveBeenCalled();
  });

  it("deriva a unidade da obra e persiste somente com o proprietário atual", async () => {
    const insertSession = vi.fn<
      CreateReadingSessionDependencies["insertSession"]
    >(async () => ({}));

    await expect(
      createReadingSession(dependencies({ insertSession }), input),
    ).resolves.toEqual({ ok: true });
    expect(insertSession).toHaveBeenCalledWith({
      durationSeconds: 2_700,
      endPosition: 42,
      notes: "Boa sessão.",
      occurredOn: "2026-07-15",
      ownerId: "user-a",
      progressUnit: "PAGE",
      startPosition: 12,
      workId: input.workId,
    });
  });

  it.each([
    ["23514", "INVALID"],
    ["23503", "NOT_FOUND"],
    ["42501", "AUTH_REQUIRED"],
    ["XX000", "UNKNOWN"],
  ] as const)("normaliza a falha %s como %s", async (errorCode, code) => {
    await expect(
      createReadingSession(
        dependencies({ insertSession: async () => ({ errorCode }) }),
        input,
      ),
    ).resolves.toEqual({ code, ok: false });
  });
});
