export const PROFILE_TIMEZONES = [
  "America/Sao_Paulo",
  "America/Recife",
  "America/Fortaleza",
  "America/Manaus",
  "America/Cuiaba",
  "America/Rio_Branco",
  "UTC",
] as const;

export type ProfileSettingsState = Readonly<{
  fieldErrors: Partial<
    Record<"avatar" | "displayName" | "timezone", readonly string[]>
  >;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_PROFILE_SETTINGS_STATE: ProfileSettingsState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

export type ProfileSettingsInput = Readonly<{
  avatarFile: File | null;
  displayName: string;
  removeAvatar: boolean;
  timezone: (typeof PROFILE_TIMEZONES)[number];
}>;

const allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarSize = 2 * 1024 * 1024;

export function validateProfileSettingsForm(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const displayNameValue = formData.get("displayName");
  const timezoneValue = formData.get("timezone");
  const avatarValue = formData.get("avatar");
  const displayName =
    typeof displayNameValue === "string" ? displayNameValue.trim() : "";
  const timezone = typeof timezoneValue === "string" ? timezoneValue : "";
  const avatarFile =
    typeof File !== "undefined" &&
    avatarValue instanceof File &&
    avatarValue.size > 0
      ? avatarValue
      : null;

  if (displayName.length < 1 || displayName.length > 80) {
    errors.displayName = ["Informe um nome com até 80 caracteres."];
  }

  if (
    !PROFILE_TIMEZONES.includes(timezone as (typeof PROFILE_TIMEZONES)[number])
  ) {
    errors.timezone = ["Selecione um fuso horário válido."];
  }

  if (avatarFile && !allowedAvatarTypes.includes(avatarFile.type)) {
    errors.avatar = ["Use uma imagem JPEG, PNG ou WebP."];
  } else if (avatarFile && avatarFile.size > maxAvatarSize) {
    errors.avatar = ["O avatar deve ter no máximo 2 MB."];
  }

  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors, ok: false } as const;
  }

  return {
    data: {
      avatarFile,
      displayName,
      removeAvatar: formData.get("removeAvatar") === "true",
      timezone: timezone as (typeof PROFILE_TIMEZONES)[number],
    } satisfies ProfileSettingsInput,
    ok: true,
  } as const;
}
