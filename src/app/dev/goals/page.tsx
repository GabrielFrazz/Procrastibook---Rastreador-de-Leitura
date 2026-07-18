import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import GoalsLoading from "@/app/(app)/goals/loading";
import { ReadingGoalsView } from "@/features/goals/components/reading-goals-view";
import {
  INITIAL_GOAL_ACTION_STATE,
  type GoalActionState,
  type GoalsData,
} from "@/features/goals/domain/reading-goals";

const goals: GoalsData = {
  goals: [
    {
      currentValue: 684,
      id: "30000000-0000-4000-8000-000000000101",
      metric: "PAGES_READ",
      periodEnd: "2026-12-31",
      periodStart: "2026-01-01",
      progressPercent: 57,
      status: "ACTIVE",
      targetValue: 1_200,
    },
    {
      currentValue: 18,
      id: "30000000-0000-4000-8000-000000000102",
      metric: "WORKS_FINISHED",
      periodEnd: "2026-07-31",
      periodStart: "2026-01-01",
      progressPercent: 100,
      status: "COMPLETED",
      targetValue: 12,
    },
    {
      currentValue: 0,
      id: "30000000-0000-4000-8000-000000000103",
      metric: "MINUTES_READ",
      periodEnd: "2026-09-30",
      periodStart: "2026-08-01",
      progressPercent: 0,
      status: "UPCOMING",
      targetValue: 900,
    },
  ],
  overview: { active: 1, completed: 1, total: 3 },
};

type PreviewPageProps = Readonly<{
  searchParams: Promise<{
    form?: string | string[];
    state?: string | string[];
  }>;
}>;

export default async function GoalsPreviewPage({
  searchParams,
}: PreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : "success";
  const form = typeof params.form === "string" ? params.form : "idle";

  if (state === "loading") {
    return (
      <AppShell displayName="Gabriel" previewPath="/goals">
        <GoalsLoading />
      </AppShell>
    );
  }
  const formState: GoalActionState =
    form === "success"
      ? {
          fieldErrors: {},
          message: "Meta criada com sucesso.",
          status: "success",
        }
      : form === "error"
        ? {
            fieldErrors: {
              periodEnd: ["A data final não pode ser anterior à data inicial."],
              targetValue: ["A meta deve ser maior que zero."],
            },
            message: "Revise os campos antes de continuar.",
            status: "error",
          }
        : INITIAL_GOAL_ACTION_STATE;

  return (
    <AppShell displayName="Gabriel" previewPath="/goals">
      <ReadingGoalsView
        formPreviewState={formState}
        result={
          state === "error"
            ? { status: "error" }
            : {
                data:
                  state === "empty"
                    ? {
                        goals: [],
                        overview: { active: 0, completed: 0, total: 0 },
                      }
                    : goals,
                status: "success",
              }
        }
        today="2026-07-15"
      />
    </AppShell>
  );
}
