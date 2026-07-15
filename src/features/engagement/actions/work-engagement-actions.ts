"use server";

import { revalidatePath } from "next/cache";

import { createWorkEngagementDependencies } from "@/features/engagement/data/work-detail-repository";
import {
  type EngagementActionState,
  validateReviewForm,
  validateWorkNoteForm,
} from "@/features/engagement/domain/work-engagement";
import {
  manageWorkNote,
  saveWorkReview,
  type WorkEngagementResult,
} from "@/features/engagement/services/work-engagement-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function errorState(
  message: string,
  fieldErrors: EngagementActionState["fieldErrors"] = {},
): EngagementActionState {
  return { fieldErrors, message, status: "error" };
}

function commandError(result: WorkEngagementResult) {
  if (result.ok) {
    return null;
  }

  if (result.code === "AUTH_REQUIRED") {
    return "Sua sessão expirou. Entre novamente antes de continuar.";
  }

  if (result.code === "NOT_FOUND") {
    return "A obra ou o conteúdo não existe mais ou não pertence à sua conta.";
  }

  if (result.code === "INVALID") {
    return "Os dados informados não são compatíveis com esta obra.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

function revalidateWork(workId: string) {
  revalidatePath(`/library/${workId}`);
  revalidatePath("/library");
  revalidatePath("/dashboard");
}

export async function saveWorkReviewAction(
  _previousState: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  const validation = validateReviewForm(formData);

  if (!validation.ok) {
    return errorState(
      "Revise a nota e o comentário antes de salvar.",
      validation.fieldErrors,
    );
  }

  let result: WorkEngagementResult;

  try {
    const supabase = await createServerSupabaseClient();
    result = await saveWorkReview(
      createWorkEngagementDependencies(supabase),
      validation.data,
    );
  } catch {
    return errorState("A avaliação está temporariamente indisponível.");
  }

  const message = commandError(result);

  if (message) {
    return errorState(message);
  }

  revalidateWork(validation.data.workId);
  return {
    fieldErrors: {},
    message: "Avaliação salva com sucesso.",
    status: "success",
  };
}

export async function manageWorkNoteAction(
  _previousState: EngagementActionState,
  formData: FormData,
): Promise<EngagementActionState> {
  const validation = validateWorkNoteForm(formData);

  if (!validation.ok) {
    return errorState(
      "Revise o conteúdo antes de continuar.",
      validation.fieldErrors,
    );
  }

  let result: WorkEngagementResult;

  try {
    const supabase = await createServerSupabaseClient();
    result = await manageWorkNote(
      createWorkEngagementDependencies(supabase),
      validation.data,
    );
  } catch {
    return errorState("As anotações estão temporariamente indisponíveis.");
  }

  const message = commandError(result);

  if (message) {
    return errorState(message);
  }

  revalidateWork(validation.data.workId);
  return {
    fieldErrors: {},
    message:
      validation.data.intent === "DELETE"
        ? "Conteúdo excluído."
        : validation.data.kind === "QUOTE"
          ? "Citação salva com sucesso."
          : "Anotação salva com sucesso.",
    status: "success",
  };
}
