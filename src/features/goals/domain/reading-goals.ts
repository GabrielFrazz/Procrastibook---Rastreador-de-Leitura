import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export type GoalMetric = Database["public"]["Enums"]["goal_metric"];

export type GoalFormField =
  "goalId" | "metric" | "periodEnd" | "periodStart" | "targetValue";

export type GoalActionState = Readonly<{
  fieldErrors: Partial<Record<GoalFormField, readonly string[]>>;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_GOAL_ACTION_STATE: GoalActionState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

export type GoalCommandInput =
  | Readonly<{
      intent: "CREATE";
      metric: GoalMetric;
      periodEnd: string;
      periodStart: string;
      targetValue: number;
    }>
  | Readonly<{
      goalId: string;
      intent: "UPDATE";
      metric: GoalMetric;
      periodEnd: string;
      periodStart: string;
      targetValue: number;
    }>
  | Readonly<{
      goalId: string;
      intent: "DELETE";
    }>;

export type GoalStatus = "ACTIVE" | "COMPLETED" | "EXPIRED" | "UPCOMING";

export type GoalSummary = Readonly<{
  currentValue: number;
  id: string;
  metric: GoalMetric;
  periodEnd: string;
  periodStart: string;
  progressPercent: number;
  status: GoalStatus;
  targetValue: number;
}>;

export type GoalsData = Readonly<{
  goals: readonly GoalSummary[];
  overview: Readonly<{
    active: number;
    completed: number;
    total: number;
  }>;
}>;

export type GoalCalculationInput = Readonly<{
  progressEvents: readonly Readonly<{
    eventType: "CORRECTION" | "UPDATE";
    newValue: number;
    previousValue: number;
    recordedAt: string;
    workId: string;
  }>[];
  sessions: readonly Readonly<{
    durationSeconds: number;
    occurredOn: string;
  }>[];
  works: readonly Readonly<{
    finishedAt: string | null;
    id: string;
    progressUnit: "CHAPTER" | "PAGE" | "PERCENT";
  }>[];
}>;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value)
    );
  }, "Informe uma data válida.");

const targetValueSchema = z
  .string()
  .trim()
  .regex(
    /^\d{1,10}(?:[.,]\d{1,2})?$/,
    "Informe um valor positivo com até duas casas decimais.",
  )
  .transform((value) => Number(value.replace(",", ".")))
  .pipe(
    z
      .number()
      .positive("A meta deve ser maior que zero.")
      .max(9_999_999_999.99, "A meta ultrapassa o limite permitido."),
  );

const goalFieldsSchema = z
  .object({
    metric: z.enum([
      "WORKS_FINISHED",
      "PAGES_READ",
      "CHAPTERS_READ",
      "MINUTES_READ",
    ]),
    periodEnd: dateSchema,
    periodStart: dateSchema,
    targetValue: targetValueSchema,
  })
  .superRefine((value, context) => {
    if (value.periodEnd < value.periodStart) {
      context.addIssue({
        code: "custom",
        message: "A data final não pode ser anterior à data inicial.",
        path: ["periodEnd"],
      });
    }
  });

const createSchema = goalFieldsSchema.and(
  z.object({ intent: z.literal("CREATE") }),
);
const updateSchema = goalFieldsSchema.and(
  z.object({
    goalId: z.string().uuid("Meta inválida."),
    intent: z.literal("UPDATE"),
  }),
);
const deleteSchema = z.object({
  goalId: z.string().uuid("Meta inválida."),
  intent: z.literal("DELETE"),
});

function readText(formData: FormData, field: GoalFormField | "intent") {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function collectFieldErrors(issues: readonly z.core.$ZodIssue[]) {
  const errors: Partial<Record<GoalFormField, string[]>> = {};

  issues.forEach((issue) => {
    const field = issue.path[0];

    if (typeof field === "string") {
      const typedField = field as GoalFormField;
      errors[typedField] = [...(errors[typedField] ?? []), issue.message];
    }
  });

  return errors;
}

export function validateGoalCommand(formData: FormData) {
  const raw = {
    goalId: readText(formData, "goalId"),
    intent: readText(formData, "intent"),
    metric: readText(formData, "metric"),
    periodEnd: readText(formData, "periodEnd"),
    periodStart: readText(formData, "periodStart"),
    targetValue: readText(formData, "targetValue"),
  };
  const schema =
    raw.intent === "DELETE"
      ? deleteSchema
      : raw.intent === "UPDATE"
        ? updateSchema
        : createSchema;
  const result = schema.safeParse(raw);

  return result.success
    ? ({ data: result.data as GoalCommandInput, ok: true } as const)
    : ({
        fieldErrors: collectFieldErrors(result.error.issues),
        ok: false,
      } as const);
}

function getDateKey(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateGoalCurrentValue(
  goal: Pick<GoalSummary, "metric" | "periodEnd" | "periodStart">,
  input: GoalCalculationInput,
  timezone: string,
) {
  const withinPeriod = (value: string) =>
    value >= goal.periodStart && value <= goal.periodEnd;

  if (goal.metric === "WORKS_FINISHED") {
    return input.works.filter(
      (work) =>
        work.finishedAt && withinPeriod(getDateKey(work.finishedAt, timezone)),
    ).length;
  }

  if (goal.metric === "MINUTES_READ") {
    return round(
      input.sessions
        .filter((session) => withinPeriod(session.occurredOn))
        .reduce((total, session) => total + session.durationSeconds, 0) / 60,
    );
  }

  const expectedUnit = goal.metric === "PAGES_READ" ? "PAGE" : "CHAPTER";
  const workById = new Map(input.works.map((work) => [work.id, work]));

  return round(
    input.progressEvents
      .filter(
        (event) =>
          event.eventType === "UPDATE" &&
          workById.get(event.workId)?.progressUnit === expectedUnit &&
          withinPeriod(getDateKey(event.recordedAt, timezone)),
      )
      .reduce(
        (total, event) =>
          total + Math.max(0, event.newValue - event.previousValue),
        0,
      ),
  );
}

export function summarizeGoals(
  goals: readonly Readonly<{
    id: string;
    metric: GoalMetric;
    periodEnd: string;
    periodStart: string;
    targetValue: number;
  }>[],
  input: GoalCalculationInput,
  today: string,
  timezone: string,
): GoalsData {
  const summaries = goals.map<GoalSummary>((goal) => {
    const currentValue = calculateGoalCurrentValue(goal, input, timezone);
    const progressPercent = Math.min(
      100,
      round((currentValue / goal.targetValue) * 100),
    );
    const status: GoalStatus =
      currentValue >= goal.targetValue
        ? "COMPLETED"
        : today < goal.periodStart
          ? "UPCOMING"
          : today > goal.periodEnd
            ? "EXPIRED"
            : "ACTIVE";

    return { ...goal, currentValue, progressPercent, status };
  });

  return {
    goals: summaries.sort((first, second) => {
      const order: Record<GoalStatus, number> = {
        ACTIVE: 0,
        UPCOMING: 1,
        COMPLETED: 2,
        EXPIRED: 3,
      };
      return (
        order[first.status] - order[second.status] ||
        first.periodEnd.localeCompare(second.periodEnd)
      );
    }),
    overview: {
      active: summaries.filter((goal) => goal.status === "ACTIVE").length,
      completed: summaries.filter((goal) => goal.status === "COMPLETED").length,
      total: summaries.length,
    },
  };
}
