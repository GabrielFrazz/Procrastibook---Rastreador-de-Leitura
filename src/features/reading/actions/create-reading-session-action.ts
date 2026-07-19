"use server";

import { revalidatePath } from "next/cache";

import { createReadingSessionDependencies } from "@/features/reading/data/reading-sessions-repository";
import {
  type ReadingSessionActionState,
  validateReadingSessionForm,
} from "@/features/reading/domain/reading-sessions";
import {
  createReadingSession,
  type CreateReadingSessionResult,
} from "@/features/reading/services/create-reading-session-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function errorState(
  message: string,
  fieldErrors: ReadingSessionActionState["fieldErrors"] = {},
): ReadingSessionActionState {
  return { fieldErrors, message, status: "error" };
}

function commandError(result: CreateReadingSessionResult) {
  if (result.ok) {
    return null;
  }

  if (result.code === "AUTH_REQUIRED") {
    return "Sua sessão expirou. Entre novamente antes de continuar.";
  }

  if (result.code === "NOT_FOUND") {
    return "A obra não existe mais ou não pertence à sua conta.";
  }

  if (result.code === "INVALID") {
    return "A posição final deve ser maior que o progresso atual e não pode ultrapassar o total da obra.";
  }

  return "Não foi possível registrar a sessão. Tente novamente.";
}

export async function createReadingSessionAction(
  _previousState: ReadingSessionActionState,
  formData: FormData,
): Promise<ReadingSessionActionState> {
  const validation = validateReadingSessionForm(formData);

  if (!validation.ok) {
    return errorState(
      "Revise os campos antes de registrar a sessão.",
      validation.fieldErrors,
    );
  }

  let result: CreateReadingSessionResult;

  try {
    const supabase = await createServerSupabaseClient();
    result = await createReadingSession(
      createReadingSessionDependencies(supabase),
      validation.data,
    );
  } catch {
    return errorState("O registro está temporariamente indisponível.");
  }

  const message = commandError(result);

  if (message) {
    return errorState(message);
  }

  revalidatePath("/sessions");
  revalidatePath("/library");
  revalidatePath(`/library/${validation.data.workId}`);
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  revalidatePath("/statistics");

  return {
    fieldErrors: {},
    message: "Sessão registrada e progresso atualizado.",
    status: "success",
  };
}
