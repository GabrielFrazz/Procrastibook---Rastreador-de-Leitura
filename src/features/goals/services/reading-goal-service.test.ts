import { describe, expect, it, vi } from "vitest";

import {
  manageReadingGoal,
  type ReadingGoalDependencies,
} from "@/features/goals/services/reading-goal-service";

function dependencies(
  overrides: Partial<ReadingGoalDependencies> = {},
): ReadingGoalDependencies {
  return {
    deleteGoal: vi.fn().mockResolvedValue(true),
    getUserId: vi
      .fn()
      .mockResolvedValue("00000000-0000-4000-8000-000000000001"),
    insertGoal: vi.fn().mockResolvedValue({}),
    updateGoal: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

const createInput = {
  intent: "CREATE",
  metric: "PAGES_READ",
  periodEnd: "2026-12-31",
  periodStart: "2026-01-01",
  targetValue: 1_000,
} as const;

describe("manageReadingGoal", () => {
  it("exige uma sessão autenticada", async () => {
    const deps = dependencies({ getUserId: vi.fn().mockResolvedValue(null) });
    await expect(manageReadingGoal(deps, createInput)).resolves.toEqual({
      code: "AUTH_REQUIRED",
      ok: false,
    });
    expect(deps.insertGoal).not.toHaveBeenCalled();
  });

  it("cria a meta com o proprietário autenticado", async () => {
    const deps = dependencies();
    await expect(manageReadingGoal(deps, createInput)).resolves.toEqual({
      ok: true,
    });
    expect(deps.insertGoal).toHaveBeenCalledWith({
      metric: "PAGES_READ",
      ownerId: "00000000-0000-4000-8000-000000000001",
      periodEnd: "2026-12-31",
      periodStart: "2026-01-01",
      targetValue: 1_000,
    });
  });

  it("atualiza somente uma meta encontrada", async () => {
    const deps = dependencies({ updateGoal: vi.fn().mockResolvedValue(false) });
    await expect(
      manageReadingGoal(deps, {
        ...createInput,
        goalId: "30000000-0000-4000-8000-000000000001",
        intent: "UPDATE",
      }),
    ).resolves.toEqual({ code: "NOT_FOUND", ok: false });
  });

  it("exclui somente uma meta encontrada", async () => {
    const deps = dependencies({ deleteGoal: vi.fn().mockResolvedValue(false) });
    await expect(
      manageReadingGoal(deps, {
        goalId: "30000000-0000-4000-8000-000000000001",
        intent: "DELETE",
      }),
    ).resolves.toEqual({ code: "NOT_FOUND", ok: false });
  });

  it("mapeia violações de constraint sem expor detalhes", async () => {
    const deps = dependencies({
      insertGoal: vi.fn().mockResolvedValue({ errorCode: "23514" }),
    });
    await expect(manageReadingGoal(deps, createInput)).resolves.toEqual({
      code: "INVALID",
      ok: false,
    });
  });

  it("mapeia falhas inesperadas para erro seguro", async () => {
    const deps = dependencies({
      insertGoal: vi.fn().mockResolvedValue({ errorCode: "XX000" }),
    });
    await expect(manageReadingGoal(deps, createInput)).resolves.toEqual({
      code: "UNKNOWN",
      ok: false,
    });
  });
});
