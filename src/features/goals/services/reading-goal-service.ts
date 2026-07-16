import type {
  GoalCommandInput,
  GoalMetric,
} from "@/features/goals/domain/reading-goals";

type PersistenceResult = Readonly<{ errorCode?: string | undefined }>;

export type ReadingGoalDependencies = Readonly<{
  deleteGoal: (ownerId: string, goalId: string) => Promise<boolean>;
  getUserId: () => Promise<string | null>;
  insertGoal: (
    goal: Readonly<{
      metric: GoalMetric;
      ownerId: string;
      periodEnd: string;
      periodStart: string;
      targetValue: number;
    }>,
  ) => Promise<PersistenceResult>;
  updateGoal: (
    ownerId: string,
    goal: Extract<GoalCommandInput, { intent: "UPDATE" }>,
  ) => Promise<boolean | PersistenceResult>;
}>;

export type ReadingGoalCommandResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      code: "AUTH_REQUIRED" | "INVALID" | "NOT_FOUND" | "UNKNOWN";
      ok: false;
    }>;

function mapFailure(code: string | undefined): ReadingGoalCommandResult {
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

export async function manageReadingGoal(
  dependencies: ReadingGoalDependencies,
  input: GoalCommandInput,
): Promise<ReadingGoalCommandResult> {
  const ownerId = await dependencies.getUserId();

  if (!ownerId) {
    return { code: "AUTH_REQUIRED", ok: false };
  }

  if (input.intent === "DELETE") {
    return (await dependencies.deleteGoal(ownerId, input.goalId))
      ? { ok: true }
      : { code: "NOT_FOUND", ok: false };
  }

  if (input.intent === "UPDATE") {
    const result = await dependencies.updateGoal(ownerId, input);

    if (typeof result === "boolean") {
      return result ? { ok: true } : { code: "NOT_FOUND", ok: false };
    }

    return result.errorCode ? mapFailure(result.errorCode) : { ok: true };
  }

  const result = await dependencies.insertGoal({
    metric: input.metric,
    ownerId,
    periodEnd: input.periodEnd,
    periodStart: input.periodStart,
    targetValue: input.targetValue,
  });

  return result.errorCode ? mapFailure(result.errorCode) : { ok: true };
}
