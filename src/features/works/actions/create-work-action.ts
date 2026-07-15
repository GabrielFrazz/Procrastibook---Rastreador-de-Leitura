"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createWorkErrorState,
  type WorkFormState,
  validateWorkForm,
} from "@/features/works/domain/work-form";
import { createManualWork } from "@/features/works/services/create-work-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createWorkAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const validation = validateWorkForm(formData);

  if (!validation.ok) {
    return createWorkErrorState(
      "Revise os campos destacados antes de continuar.",
      validation.fieldErrors,
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await createManualWork(supabase, validation.data);

    if (!result.ok) {
      if (result.code === "DUPLICATE") {
        if (validation.data.externalSource) {
          return createWorkErrorState(
            "Esta obra importada já está cadastrada na sua biblioteca.",
          );
        }

        return createWorkErrorState(
          "Já existe uma obra com este identificador na sua biblioteca.",
          { isbn13: ["Este ISBN-13 já está cadastrado."] },
        );
      }

      if (result.code === "COVER_UPLOAD_FAILED") {
        return createWorkErrorState(
          "Não foi possível enviar a capa. Tente outra imagem.",
          { cover: ["O upload da capa falhou."] },
        );
      }

      if (result.code === "AUTH_REQUIRED") {
        return createWorkErrorState(
          "Sua sessão expirou. Entre novamente antes de salvar.",
        );
      }

      return createWorkErrorState(
        "Não foi possível salvar a obra. Tente novamente.",
      );
    }
  } catch {
    return createWorkErrorState(
      "O cadastro está temporariamente indisponível. Tente novamente.",
    );
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");
  redirect("/library?notice=work-created");
}
