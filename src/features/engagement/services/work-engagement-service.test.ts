import { describe, expect, it, vi } from "vitest";

import {
  manageWorkNote,
  saveWorkReview,
  type WorkEngagementDependencies,
} from "@/features/engagement/services/work-engagement-service";

const workId = "10000000-0000-4000-8000-000000000001";
const sessionId = "40000000-0000-4000-8000-000000000001";
const noteId = "50000000-0000-4000-8000-000000000001";

function dependencies(
  overrides: Partial<WorkEngagementDependencies> = {},
): WorkEngagementDependencies {
  return {
    deleteNote: async () => true,
    getUserId: async () => "user-a",
    insertNote: async () => ({}),
    isOwnedSessionForWork: async () => true,
    isOwnedWork: async () => true,
    upsertReview: async () => ({}),
    ...overrides,
  };
}

describe("saveWorkReview", () => {
  it("exige autenticação antes de consultar a obra", async () => {
    const isOwnedWork = vi.fn<WorkEngagementDependencies["isOwnedWork"]>();
    await expect(
      saveWorkReview(
        dependencies({ getUserId: async () => null, isOwnedWork }),
        {
          body: "Review",
          rating: 4,
          workId,
        },
      ),
    ).resolves.toEqual({ code: "AUTH_REQUIRED", ok: false });
    expect(isOwnedWork).not.toHaveBeenCalled();
  });

  it("não salva review em obra de outro usuário", async () => {
    const upsertReview = vi.fn<WorkEngagementDependencies["upsertReview"]>();
    await expect(
      saveWorkReview(
        dependencies({ isOwnedWork: async () => false, upsertReview }),
        { rating: 5, workId },
      ),
    ).resolves.toEqual({ code: "NOT_FOUND", ok: false });
    expect(upsertReview).not.toHaveBeenCalled();
  });

  it("faz upsert com o proprietário autenticado", async () => {
    const upsertReview = vi.fn<WorkEngagementDependencies["upsertReview"]>(
      async () => ({}),
    );
    await expect(
      saveWorkReview(dependencies({ upsertReview }), {
        body: "Ótima leitura.",
        rating: 5,
        workId,
      }),
    ).resolves.toEqual({ ok: true });
    expect(upsertReview).toHaveBeenCalledWith({
      body: "Ótima leitura.",
      ownerId: "user-a",
      rating: 5,
      workId,
    });
  });
});

describe("manageWorkNote", () => {
  it("valida a relação opcional com uma sessão da mesma obra", async () => {
    const insertNote = vi.fn<WorkEngagementDependencies["insertNote"]>();
    await expect(
      manageWorkNote(
        dependencies({
          insertNote,
          isOwnedSessionForWork: async () => false,
        }),
        {
          content: "Citação",
          intent: "CREATE",
          kind: "QUOTE",
          sessionId,
          workId,
        },
      ),
    ).resolves.toEqual({ code: "INVALID", ok: false });
    expect(insertNote).not.toHaveBeenCalled();
  });

  it("cria anotação com proprietário e contexto validados", async () => {
    const insertNote = vi.fn<WorkEngagementDependencies["insertNote"]>(
      async () => ({}),
    );
    await expect(
      manageWorkNote(dependencies({ insertNote }), {
        content: "Revisar este argumento.",
        intent: "CREATE",
        kind: "NOTE",
        locationLabel: "Capítulo 4",
        workId,
      }),
    ).resolves.toEqual({ ok: true });
    expect(insertNote).toHaveBeenCalledWith({
      content: "Revisar este argumento.",
      kind: "NOTE",
      locationLabel: "Capítulo 4",
      ownerId: "user-a",
      workId,
    });
  });

  it("exclui somente uma anotação pertencente à obra atual", async () => {
    const deleteNote = vi.fn<WorkEngagementDependencies["deleteNote"]>(
      async () => false,
    );
    await expect(
      manageWorkNote(dependencies({ deleteNote }), {
        intent: "DELETE",
        noteId,
        workId,
      }),
    ).resolves.toEqual({ code: "NOT_FOUND", ok: false });
    expect(deleteNote).toHaveBeenCalledWith("user-a", noteId, workId);
  });

  it.each([
    ["23514", "INVALID"],
    ["23503", "NOT_FOUND"],
    ["42501", "AUTH_REQUIRED"],
    ["XX000", "UNKNOWN"],
  ] as const)("normaliza a falha %s como %s", async (errorCode, code) => {
    await expect(
      manageWorkNote(
        dependencies({ insertNote: async () => ({ errorCode }) }),
        { content: "Nota", intent: "CREATE", kind: "NOTE", workId },
      ),
    ).resolves.toEqual({ code, ok: false });
  });
});
