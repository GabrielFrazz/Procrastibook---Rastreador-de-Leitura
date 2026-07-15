import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

type WorkRow = Database["public"]["Tables"]["works"]["Row"];

export type ReadingListWork = Readonly<{
  authors: readonly string[];
  id: string;
  status: WorkRow["status"];
  title: string;
  type: WorkRow["type"];
}>;

export type ReadingListSummary = Readonly<{
  description: string | null;
  id: string;
  items: readonly ReadingListWork[];
  name: string;
  updatedAt: string;
}>;

export type ReadingListsData = Readonly<{
  lists: readonly ReadingListSummary[];
  works: readonly ReadingListWork[];
}>;

export type ReadingListField =
  "description" | "intent" | "listId" | "name" | "workId";

export type ReadingListActionState = Readonly<{
  fieldErrors: Partial<Record<ReadingListField, readonly string[]>>;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_READING_LIST_ACTION_STATE: ReadingListActionState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

const createReadingListSchema = z.object({
  description: z.string().trim().max(500).optional(),
  name: z.string().trim().min(1).max(80),
});

const manageReadingListSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("ADD_ITEM"),
    listId: z.string().uuid(),
    workId: z.string().uuid(),
  }),
  z.object({
    intent: z.literal("REMOVE_ITEM"),
    listId: z.string().uuid(),
    workId: z.string().uuid(),
  }),
  z.object({
    intent: z.literal("DELETE_LIST"),
    listId: z.string().uuid(),
    workId: z.string().optional(),
  }),
]);

export type CreateReadingListInput = z.infer<typeof createReadingListSchema>;
export type ManageReadingListInput = z.infer<typeof manageReadingListSchema>;

function readText(formData: FormData, field: ReadingListField) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function fieldErrors(
  issues: readonly z.core.$ZodIssue[],
): ReadingListActionState["fieldErrors"] {
  const errors: Partial<Record<ReadingListField, string[]>> = {};

  issues.forEach((issue) => {
    const field = issue.path[0];

    if (typeof field === "string") {
      const typedField = field as ReadingListField;
      errors[typedField] = [...(errors[typedField] ?? []), issue.message];
    }
  });

  return errors;
}

export function validateCreateReadingList(formData: FormData) {
  const result = createReadingListSchema.safeParse({
    description: readText(formData, "description") || undefined,
    name: readText(formData, "name"),
  });

  return result.success
    ? ({ data: result.data, ok: true } as const)
    : ({ fieldErrors: fieldErrors(result.error.issues), ok: false } as const);
}

export function validateManageReadingList(formData: FormData) {
  const result = manageReadingListSchema.safeParse({
    intent: readText(formData, "intent"),
    listId: readText(formData, "listId"),
    workId: readText(formData, "workId") || undefined,
  });

  return result.success
    ? ({ data: result.data, ok: true } as const)
    : ({ fieldErrors: fieldErrors(result.error.issues), ok: false } as const);
}
