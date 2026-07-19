import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

type ProgressUnit = Database["public"]["Enums"]["progress_unit"];

export type ReadingSessionFormField =
  "durationMinutes" | "endPosition" | "notes" | "occurredOn" | "workId";

export type ReadingSessionActionState = Readonly<{
  fieldErrors: Partial<Record<ReadingSessionFormField, readonly string[]>>;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_READING_SESSION_ACTION_STATE: ReadingSessionActionState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

export type ReadingSessionWork = Readonly<{
  currentProgress: number;
  id: string;
  progressUnit: ProgressUnit;
  title: string;
  totalProgress: number | null;
}>;

export type ReadingSessionItem = Readonly<{
  createdAt: string;
  durationSeconds: number;
  endPosition: number | null;
  id: string;
  notes: string | null;
  occurredOn: string;
  progressUnit: ProgressUnit;
  startPosition: number | null;
  workId: string;
  workTitle: string;
}>;

export type ReadingSessionsSummary = Readonly<{
  chaptersRead: number;
  pagesRead: number;
  percentPointsRead: number;
  sessionCount: number;
  totalDurationSeconds: number;
}>;

export type ReadingSessionsData = Readonly<{
  sessions: readonly ReadingSessionItem[];
  summary: ReadingSessionsSummary;
  works: readonly ReadingSessionWork[];
}>;

const decimalPattern = /^\d{1,8}(?:[.,]\d{1,2})?$/;

const positionSchema = z
  .string()
  .trim()
  .refine(
    (value) => decimalPattern.test(value),
    "Informe uma posição válida com até duas casas decimais.",
  )
  .transform((value) => Number(value.replace(",", ".")))
  .pipe(z.number().positive("A posição final deve ser maior que zero."));

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value)
    );
  }, "Informe uma data válida.");

const formSchema = z
  .object({
    durationMinutes: z
      .string()
      .trim()
      .regex(/^\d{1,4}$/, "Informe a duração em minutos inteiros.")
      .transform(Number)
      .pipe(
        z
          .number()
          .int()
          .min(1, "A duração deve ser maior que zero.")
          .max(1_440, "A duração não pode superar 24 horas."),
      ),
    endPosition: positionSchema,
    notes: z
      .string()
      .trim()
      .max(2_000, "As anotações podem ter no máximo 2.000 caracteres.")
      .transform((value) => value || undefined),
    occurredOn: dateSchema,
    workId: z.string().uuid("Selecione uma obra válida."),
  })
  .transform(({ durationMinutes, ...value }) => ({
    ...value,
    durationSeconds: durationMinutes * 60,
  }));

export type CreateReadingSessionInput = z.infer<typeof formSchema>;

function readText(formData: FormData, field: ReadingSessionFormField) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function collectFieldErrors(
  issues: readonly z.core.$ZodIssue[],
): ReadingSessionActionState["fieldErrors"] {
  const errors: Partial<Record<ReadingSessionFormField, string[]>> = {};

  issues.forEach((issue) => {
    const field = issue.path[0];

    if (typeof field === "string") {
      const typedField = field as ReadingSessionFormField;
      errors[typedField] = [...(errors[typedField] ?? []), issue.message];
    }
  });

  return errors;
}

export function validateReadingSessionForm(formData: FormData) {
  const result = formSchema.safeParse({
    durationMinutes: readText(formData, "durationMinutes"),
    endPosition: readText(formData, "endPosition"),
    notes: readText(formData, "notes"),
    occurredOn: readText(formData, "occurredOn"),
    workId: readText(formData, "workId"),
  });

  return result.success
    ? ({ data: result.data, ok: true } as const)
    : ({
        fieldErrors: collectFieldErrors(result.error.issues),
        ok: false,
      } as const);
}

export function getReadingSessionUnitsRead(
  session: Pick<ReadingSessionItem, "endPosition" | "startPosition">,
) {
  if (session.startPosition === null || session.endPosition === null) {
    return 0;
  }

  return Math.max(0, session.endPosition - session.startPosition);
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function summarizeReadingSessions(
  sessions: readonly ReadingSessionItem[],
): ReadingSessionsSummary {
  return sessions.reduce<ReadingSessionsSummary>(
    (summary, session) => {
      const unitsRead = getReadingSessionUnitsRead(session);

      return {
        chaptersRead: round(
          summary.chaptersRead +
            (session.progressUnit === "CHAPTER" ? unitsRead : 0),
        ),
        pagesRead: round(
          summary.pagesRead + (session.progressUnit === "PAGE" ? unitsRead : 0),
        ),
        percentPointsRead: round(
          summary.percentPointsRead +
            (session.progressUnit === "PERCENT" ? unitsRead : 0),
        ),
        sessionCount: summary.sessionCount + 1,
        totalDurationSeconds:
          summary.totalDurationSeconds + session.durationSeconds,
      };
    },
    {
      chaptersRead: 0,
      pagesRead: 0,
      percentPointsRead: 0,
      sessionCount: 0,
      totalDurationSeconds: 0,
    },
  );
}

export function formatReadingDuration(durationSeconds: number) {
  const totalMinutes = Math.round(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function getDateKeyInTimezone(date: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: timezone,
      year: "numeric",
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return getDateKeyInTimezone(date, "America/Sao_Paulo");
  }
}

export function formatSessionDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 12)),
  );
}
