"use server";

import { revalidatePath } from "next/cache";

import { createReadingGoalDependencies } from "@/features/goals/data/reading-goals-repository";
import {
  type GoalActionState,
  validateGoalCommand,
} from "@/features/goals/domain/reading-goals";
import {
  manageReadingGoal,
  type ReadingGoalCommandResult,
} from "@/features/goals/services/reading-goal-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function errorState(
  message: string,
  fieldErrors: GoalActionState["fieldErrors"] = {},
): GoalActionState {
  return { fieldErrors, message, status: "error" };
}

function commandError(result: ReadingGoalCommandResult) {
  if (result.ok) {
    return null;
  }

  if (result.code === "AUTH_REQUIRED") {
    return "Sua sessão expirou. Entre novamente antes de continuar.";
  }

  if (result.code === "NOT_FOUND") {
    return "A meta não existe mais ou não pertence à sua conta.";
  }

  if (result.code === "INVALID") {
    return "O valor ou o período da meta não respeita os limites permitidos.";
  }

  return "Não foi possível atualizar a meta. Tente novamente.";
}

export async function manageReadingGoalAction(
  _previousState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const validation = validateGoalCommand(formData);

  if (!validation.ok) {
    return errorState(
      "Revise os campos antes de continuar.",
      validation.fieldErrors,
    );
  }

  let result: ReadingGoalCommandResult;

  try {
    const supabase = await createServerSupabaseClient();
    result = await manageReadingGoal(
      createReadingGoalDependencies(supabase),
      validation.data,
    );
  } catch {
    return errorState(
      "A atualização das metas está temporariamente indisponível.",
    );
  }

  const message = commandError(result);

  if (message) {
    return errorState(message);
  }

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/statistics");

  const successMessage =
    validation.data.intent === "CREATE"
      ? "Meta criada com sucesso."
      : validation.data.intent === "UPDATE"
        ? "Meta atualizada com sucesso."
        : "Meta excluída com sucesso.";

  return { fieldErrors: {}, message: successMessage, status: "success" };
}
