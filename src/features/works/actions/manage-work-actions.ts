"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type WorkManagementState,
  validateDeleteWorkForm,
  validateUpdateWorkForm,
} from "@/features/works/domain/work-management";
import {
  deleteOwnedWork,
  updateOwnedWork,
} from "@/features/works/services/manage-work-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateWorkAction(
  _previousState: WorkManagementState,
  formData: FormData,
): Promise<WorkManagementState> {
  const validation = validateUpdateWorkForm(formData);

  if (!validation.ok) {
    return {
      fieldErrors: validation.fieldErrors,
      message: "Revise os campos destacados antes de salvar.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const result = await updateOwnedWork(supabase, validation.data);

  if (!result.ok) {
    const message =
      result.code === "DUPLICATE"
        ? "Outra obra já usa um dos identificadores informados."
        : result.code === "INVALID"
          ? "Os dados conflitam com o progresso atual da obra."
          : result.code === "NOT_FOUND"
            ? "A obra não foi encontrada ou não pertence a você."
            : "Não foi possível atualizar a obra agora.";

    return { fieldErrors: {}, message, status: "error" };
  }

  revalidatePath(`/library/${validation.data.workId}`);
  revalidatePath("/library");
  revalidatePath("/dashboard");
  revalidatePath("/statistics");

  return {
    fieldErrors: {},
    message: "Dados da obra atualizados.",
    status: "success",
  };
}

export async function deleteWorkAction(
  _previousState: WorkManagementState,
  formData: FormData,
): Promise<WorkManagementState> {
  const validation = validateDeleteWorkForm(formData);

  if (!validation.ok) {
    return {
      fieldErrors: {
        confirmation: ["Confirme a exclusão antes de continuar."],
      },
      message: "A confirmação é obrigatória.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const result = await deleteOwnedWork(supabase, validation.data.workId);

  if (!result.ok) {
    return {
      fieldErrors: {},
      message:
        result.code === "NOT_FOUND"
          ? "A obra não foi encontrada ou não pertence a você."
          : "Não foi possível excluir a obra agora.",
      status: "error",
    };
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");
  revalidatePath("/statistics");
  redirect("/library?notice=work-deleted");
}
