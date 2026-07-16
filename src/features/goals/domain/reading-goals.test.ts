import { describe, expect, it } from "vitest";

import {
  calculateGoalCurrentValue,
  summarizeGoals,
  validateGoalCommand,
  type GoalCalculationInput,
} from "@/features/goals/domain/reading-goals";

const input: GoalCalculationInput = {
  progressEvents: [
    {
      eventType: "UPDATE",
      newValue: 42,
      previousValue: 10,
      recordedAt: "2026-07-10T02:00:00.000Z",
      workId: "10000000-0000-4000-8000-000000000001",
    },
    {
      eventType: "CORRECTION",
      newValue: 20,
      previousValue: 42,
      recordedAt: "2026-07-11T12:00:00.000Z",
      workId: "10000000-0000-4000-8000-000000000001",
    },
    {
      eventType: "UPDATE",
      newValue: 8,
      previousValue: 3,
      recordedAt: "2026-07-12T12:00:00.000Z",
      workId: "10000000-0000-4000-8000-000000000002",
    },
  ],
  sessions: [
    { durationSeconds: 1_800, occurredOn: "2026-07-10" },
    { durationSeconds: 900, occurredOn: "2026-06-30" },
  ],
  works: [
    {
      finishedAt: "2026-07-15T01:30:00.000Z",
      id: "10000000-0000-4000-8000-000000000001",
      progressUnit: "PAGE",
    },
    {
      finishedAt: null,
      id: "10000000-0000-4000-8000-000000000002",
      progressUnit: "CHAPTER",
    },
  ],
};

function goalForm(intent = "CREATE") {
  const formData = new FormData();
  formData.set("intent", intent);
  formData.set("metric", "PAGES_READ");
  formData.set("targetValue", "120,5");
  formData.set("periodStart", "2026-07-01");
  formData.set("periodEnd", "2026-07-31");
  return formData;
}

describe("validateGoalCommand", () => {
  it("normaliza uma nova meta válida", () => {
    expect(validateGoalCommand(goalForm())).toEqual({
      data: {
        intent: "CREATE",
        metric: "PAGES_READ",
        periodEnd: "2026-07-31",
        periodStart: "2026-07-01",
        targetValue: 120.5,
      },
      ok: true,
    });
  });

  it("aceita atualização com identificador", () => {
    const formData = goalForm("UPDATE");
    formData.set("goalId", "30000000-0000-4000-8000-000000000001");
    expect(validateGoalCommand(formData).ok).toBe(true);
  });

  it("aceita exclusão somente com identificador", () => {
    const formData = new FormData();
    formData.set("intent", "DELETE");
    formData.set("goalId", "30000000-0000-4000-8000-000000000001");
    expect(validateGoalCommand(formData).ok).toBe(true);
  });

  it("rejeita período invertido e alvo inválido", () => {
    const formData = goalForm();
    formData.set("targetValue", "0");
    formData.set("periodStart", "2026-08-01");
    expect(validateGoalCommand(formData)).toMatchObject({
      fieldErrors: {
        periodEnd: expect.any(Array),
        targetValue: expect.any(Array),
      },
      ok: false,
    });
  });
});

describe("calculateGoalCurrentValue", () => {
  const period = { periodEnd: "2026-07-31", periodStart: "2026-07-01" };

  it("soma somente avanços por página e ignora correções", () => {
    expect(
      calculateGoalCurrentValue(
        { ...period, metric: "PAGES_READ" },
        input,
        "America/Sao_Paulo",
      ),
    ).toBe(32);
  });

  it("soma capítulos da unidade compatível", () => {
    expect(
      calculateGoalCurrentValue(
        { ...period, metric: "CHAPTERS_READ" },
        input,
        "America/Sao_Paulo",
      ),
    ).toBe(5);
  });

  it("converte a duração de sessões para minutos", () => {
    expect(
      calculateGoalCurrentValue(
        { ...period, metric: "MINUTES_READ" },
        input,
        "America/Sao_Paulo",
      ),
    ).toBe(30);
  });

  it("considera o fuso na conclusão de obras", () => {
    expect(
      calculateGoalCurrentValue(
        { ...period, metric: "WORKS_FINISHED" },
        input,
        "America/Sao_Paulo",
      ),
    ).toBe(1);
  });
});

describe("summarizeGoals", () => {
  it("classifica e limita o progresso visual a cem por cento", () => {
    const result = summarizeGoals(
      [
        {
          id: "1",
          metric: "MINUTES_READ",
          periodEnd: "2026-07-31",
          periodStart: "2026-07-01",
          targetValue: 20,
        },
        {
          id: "2",
          metric: "PAGES_READ",
          periodEnd: "2026-08-31",
          periodStart: "2026-08-01",
          targetValue: 100,
        },
      ],
      input,
      "2026-07-15",
      "America/Sao_Paulo",
    );

    expect(result.overview).toEqual({ active: 0, completed: 1, total: 2 });
    expect(result.goals[0]).toMatchObject({ id: "2", status: "UPCOMING" });
    expect(result.goals[1]).toMatchObject({
      id: "1",
      progressPercent: 100,
      status: "COMPLETED",
    });
  });
});
