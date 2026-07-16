"use server";

import { revalidatePath } from "next/cache";

import {
  type ProfileSettingsState,
  validateProfileSettingsForm,
} from "@/features/profile/domain/profile-settings";
import { updateCurrentProfile } from "@/features/profile/services/update-profile-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateProfileSettingsAction(
  _previousState: ProfileSettingsState,
  formData: FormData,
): Promise<ProfileSettingsState> {
  const validation = validateProfileSettingsForm(formData);

  if (!validation.ok) {
    return {
      fieldErrors: validation.fieldErrors,
      message: "Revise os campos destacados antes de salvar.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const result = await updateCurrentProfile(supabase, validation.data);

  if (!result.ok) {
    return {
      fieldErrors:
        result.code === "UPLOAD_FAILED"
          ? { avatar: ["Não foi possível enviar esta imagem."] }
          : {},
      message:
        result.code === "AUTH_REQUIRED"
          ? "Sua sessão expirou. Entre novamente."
          : "Não foi possível atualizar o perfil agora.",
      status: "error",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");

  return { fieldErrors: {}, message: "Perfil atualizado.", status: "success" };
}
