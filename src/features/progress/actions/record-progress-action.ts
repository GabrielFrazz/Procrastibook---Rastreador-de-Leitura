"use server";

import { revalidatePath } from "next/cache";

import {
  type ProgressActionState,
  validateProgressForm,
} from "@/features/progress/domain/progress-form";
import {
  recordProgress,
  type RecordProgressResult,
} from "@/features/progress/services/record-progress-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function errorState(
  message: string,
  fieldErrors: ProgressActionState["fieldErrors"] = {},
): ProgressActionState {
  return { fieldErrors, message, status: "error" };
}

function commandError(result: RecordProgressResult) {
  if (result.ok) {
    return null;
  }

  if (result.code === "AUTH_REQUIRED") {
    return "Sua sessão expirou ou a obra não pertence à sua conta.";
  }

  if (result.code === "CONFLICT") {
    return "O progresso mudou em outra operação. Recarregue a página antes de tentar novamente.";
  }

  if (result.code === "INVALID") {
    return "O progresso informado viola os limites da obra. Reduções devem ser registradas como correção.";
  }

  return "Não foi possível atualizar o progresso. Tente novamente.";
}

export async function recordProgressAction(
  _previousState: ProgressActionState,
  formData: FormData,
): Promise<ProgressActionState> {
  const validation = validateProgressForm(formData);

  if (!validation.ok) {
    return errorState(
      "Revise o valor informado antes de atualizar.",
      validation.fieldErrors,
    );
  }

  let result: RecordProgressResult;

  try {
    const supabase = await createServerSupabaseClient();
    result = await recordProgress(supabase, validation.data);
  } catch {
    return errorState("A atualização está temporariamente indisponível.");
  }

  const message = commandError(result);

  if (message) {
    return errorState(message);
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");

  return {
    fieldErrors: {},
    message: "Progresso atualizado com sucesso.",
    status: "success",
  };
}
