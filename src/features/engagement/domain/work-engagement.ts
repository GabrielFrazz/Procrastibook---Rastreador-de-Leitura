import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

type NoteKind = Database["public"]["Enums"]["note_kind"];
type ProgressUnit = Database["public"]["Enums"]["progress_unit"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type WorkType = Database["public"]["Enums"]["work_type"];

export type EngagementActionState = Readonly<{
  fieldErrors: Partial<Record<string, readonly string[]>>;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_ENGAGEMENT_ACTION_STATE: EngagementActionState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

export type WorkReview = Readonly<{
  body: string | null;
  rating: number;
  updatedAt: string;
}>;

export type WorkNote = Readonly<{
  content: string;
  createdAt: string;
  id: string;
  kind: NoteKind;
  locationLabel: string | null;
  sessionOccurredOn: string | null;
}>;

export type WorkSessionOption = Readonly<{
  id: string;
  occurredOn: string;
}>;

export type WorkDetail = Readonly<{
  authors: readonly string[];
  chapterCount: number | null;
  coverUrl: string | null;
  currentProgress: number;
  description: string | null;
  genres: readonly string[];
  id: string;
  identifiers: readonly string[];
  language: string | null;
  pageCount: number | null;
  progressUnit: ProgressUnit;
  publishedYear: number | null;
  publisher: string | null;
  status: ReadingStatus;
  subtitle: string | null;
  title: string;
  type: WorkType;
}>;

export type WorkDetailData = Readonly<{
  notes: readonly WorkNote[];
  review: WorkReview | null;
  sessions: readonly WorkSessionOption[];
  work: WorkDetail;
}>;

const reviewSchema = z.object({
  body: z
    .string()
    .trim()
    .max(5_000, "O comentário pode ter no máximo 5.000 caracteres.")
    .transform((value) => value || undefined),
  rating: z
    .enum(["1", "2", "3", "4", "5"], {
      error: "Escolha uma nota entre 1 e 5.",
    })
    .transform(Number),
  workId: z.string().uuid("A obra informada é inválida."),
});

const createNoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Escreva o conteúdo antes de salvar.")
    .max(5_000, "O conteúdo pode ter no máximo 5.000 caracteres."),
  intent: z.literal("CREATE"),
  kind: z.enum(["NOTE", "QUOTE"], {
    error: "Escolha entre anotação e citação.",
  }),
  locationLabel: z
    .string()
    .trim()
    .max(120, "A localização pode ter no máximo 120 caracteres.")
    .transform((value) => value || undefined),
  sessionId: z
    .string()
    .trim()
    .refine((value) => value === "" || z.uuid().safeParse(value).success, {
      message: "A sessão selecionada é inválida.",
    })
    .transform((value) => value || undefined),
  workId: z.string().uuid("A obra informada é inválida."),
});

const deleteNoteSchema = z.object({
  intent: z.literal("DELETE"),
  noteId: z.string().uuid("A anotação informada é inválida."),
  workId: z.string().uuid("A obra informada é inválida."),
});

export type SaveReviewInput = Readonly<{
  body?: string | undefined;
  rating: number;
  workId: string;
}>;

export type ManageWorkNoteInput =
  | Readonly<{
      content: string;
      intent: "CREATE";
      kind: NoteKind;
      locationLabel?: string | undefined;
      sessionId?: string | undefined;
      workId: string;
    }>
  | Readonly<{
      intent: "DELETE";
      noteId: string;
      workId: string;
    }>;

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function collectFieldErrors(issues: readonly z.core.$ZodIssue[]) {
  const errors: Record<string, string[]> = {};

  issues.forEach((issue) => {
    const field = issue.path[0];

    if (typeof field === "string") {
      errors[field] = [...(errors[field] ?? []), issue.message];
    }
  });

  return errors;
}

export function validateReviewForm(formData: FormData) {
  const result = reviewSchema.safeParse({
    body: readText(formData, "body"),
    rating: readText(formData, "rating"),
    workId: readText(formData, "workId"),
  });

  return result.success
    ? ({ data: result.data, ok: true } as const)
    : ({
        fieldErrors: collectFieldErrors(result.error.issues),
        ok: false,
      } as const);
}

export function validateWorkNoteForm(formData: FormData) {
  const intent = readText(formData, "intent");
  const result =
    intent === "DELETE"
      ? deleteNoteSchema.safeParse({
          intent,
          noteId: readText(formData, "noteId"),
          workId: readText(formData, "workId"),
        })
      : createNoteSchema.safeParse({
          content: readText(formData, "content"),
          intent,
          kind: readText(formData, "kind"),
          locationLabel: readText(formData, "locationLabel"),
          sessionId: readText(formData, "sessionId"),
          workId: readText(formData, "workId"),
        });

  return result.success
    ? ({ data: result.data, ok: true } as const)
    : ({
        fieldErrors: collectFieldErrors(result.error.issues),
        ok: false,
      } as const);
}
