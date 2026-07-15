import { z } from "zod";

export type ProgressFormField =
  "eventType" | "expectedPreviousValue" | "newValue" | "workId";

export type ProgressActionState = Readonly<{
  fieldErrors: Partial<Record<ProgressFormField, readonly string[]>>;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_PROGRESS_ACTION_STATE: ProgressActionState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

const decimalSchema = z
  .string()
  .trim()
  .regex(
    /^\d{1,8}(?:[.,]\d{1,2})?$/,
    "Informe um valor válido com até duas casas decimais.",
  )
  .transform((value) => Number(value.replace(",", ".")));

const progressFormSchema = z.object({
  eventType: z.enum(["UPDATE", "CORRECTION"]),
  expectedPreviousValue: decimalSchema,
  newValue: decimalSchema,
  workId: z.string().uuid(),
});

export type RecordProgressInput = z.infer<typeof progressFormSchema>;

function readText(formData: FormData, field: ProgressFormField) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function fieldErrors(
  issues: readonly z.core.$ZodIssue[],
): ProgressActionState["fieldErrors"] {
  const errors: Partial<Record<ProgressFormField, string[]>> = {};

  issues.forEach((issue) => {
    const field = issue.path[0];

    if (typeof field === "string") {
      const typedField = field as ProgressFormField;
      errors[typedField] = [...(errors[typedField] ?? []), issue.message];
    }
  });

  return errors;
}

export function validateProgressForm(formData: FormData) {
  const result = progressFormSchema.safeParse({
    eventType: readText(formData, "eventType"),
    expectedPreviousValue: readText(formData, "expectedPreviousValue"),
    newValue: readText(formData, "newValue"),
    workId: readText(formData, "workId"),
  });

  return result.success
    ? ({ data: result.data, ok: true } as const)
    : ({ fieldErrors: fieldErrors(result.error.issues), ok: false } as const);
}
