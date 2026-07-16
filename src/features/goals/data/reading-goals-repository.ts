import {
  summarizeGoals,
  type GoalsData,
} from "@/features/goals/domain/reading-goals";
import type { ReadingGoalDependencies } from "@/features/goals/services/reading-goal-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

export class ReadingGoalsQueryError extends Error {
  constructor() {
    super("Não foi possível carregar as metas.");
    this.name = "ReadingGoalsQueryError";
  }
}

export function createReadingGoalDependencies(
  supabase: ServerSupabaseClient,
): ReadingGoalDependencies {
  return {
    deleteGoal: async (ownerId, goalId) => {
      const result = await supabase
        .from("goals")
        .delete()
        .eq("owner_id", ownerId)
        .eq("id", goalId)
        .select("id");
      return !result.error && result.data.length === 1;
    },
    getUserId: async () => {
      const result = await supabase.auth.getUser();
      return result.error ? null : (result.data.user?.id ?? null);
    },
    insertGoal: async (goal) => {
      const result = await supabase.from("goals").insert({
        metric: goal.metric,
        owner_id: goal.ownerId,
        period_end: goal.periodEnd,
        period_start: goal.periodStart,
        target_value: goal.targetValue,
      });
      return result.error ? { errorCode: result.error.code } : {};
    },
    updateGoal: async (ownerId, goal) => {
      const result = await supabase
        .from("goals")
        .update({
          metric: goal.metric,
          period_end: goal.periodEnd,
          period_start: goal.periodStart,
          target_value: goal.targetValue,
        })
        .eq("owner_id", ownerId)
        .eq("id", goal.goalId)
        .select("id");

      if (result.error) {
        return { errorCode: result.error.code };
      }

      return result.data.length === 1;
    },
  };
}

export async function getReadingGoalsData({
  today,
  timezone,
}: Readonly<{ today: string; timezone: string }>): Promise<GoalsData> {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();
  const ownerId = userResult.data.user?.id;

  if (userResult.error || !ownerId) {
    throw new ReadingGoalsQueryError();
  }

  const [goalsResult, worksResult, progressResult, sessionsResult] =
    await Promise.all([
      supabase
        .from("goals")
        .select("id, metric, target_value, period_start, period_end")
        .eq("owner_id", ownerId),
      supabase
        .from("works")
        .select("id, progress_unit, finished_at")
        .eq("owner_id", ownerId),
      supabase
        .from("progress_events")
        .select("work_id, event_type, previous_value, new_value, recorded_at")
        .eq("owner_id", ownerId),
      supabase
        .from("reading_sessions")
        .select("duration_seconds, occurred_on")
        .eq("owner_id", ownerId),
    ]);

  if (
    goalsResult.error ||
    worksResult.error ||
    progressResult.error ||
    sessionsResult.error
  ) {
    throw new ReadingGoalsQueryError();
  }

  return summarizeGoals(
    goalsResult.data.map((goal) => ({
      id: goal.id,
      metric: goal.metric,
      periodEnd: goal.period_end,
      periodStart: goal.period_start,
      targetValue: goal.target_value,
    })),
    {
      progressEvents: progressResult.data.map((event) => ({
        eventType: event.event_type,
        newValue: event.new_value,
        previousValue: event.previous_value,
        recordedAt: event.recorded_at,
        workId: event.work_id,
      })),
      sessions: sessionsResult.data.map((session) => ({
        durationSeconds: session.duration_seconds,
        occurredOn: session.occurred_on,
      })),
      works: worksResult.data.map((work) => ({
        finishedAt: work.finished_at,
        id: work.id,
        progressUnit: work.progress_unit,
      })),
    },
    today,
    timezone,
  );
}
