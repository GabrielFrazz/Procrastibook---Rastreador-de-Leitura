"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";

import { Button, Card, FormField, Input, Select } from "@/components/ui";
import { updateProfileSettingsAction } from "@/features/profile/actions/profile-settings-action";
import type { ProfileSettingsData } from "@/features/profile/data/profile-settings-repository";
import {
  INITIAL_PROFILE_SETTINGS_STATE,
  PROFILE_TIMEZONES,
} from "@/features/profile/domain/profile-settings";

const timezoneLabels: Readonly<
  Record<(typeof PROFILE_TIMEZONES)[number], string>
> = {
  "America/Cuiaba": "Cuiabá",
  "America/Fortaleza": "Fortaleza",
  "America/Manaus": "Manaus",
  "America/Recife": "Recife",
  "America/Rio_Branco": "Rio Branco",
  "America/Sao_Paulo": "São Paulo",
  UTC: "UTC",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} type="submit">
      {pending ? "Salvando…" : "Salvar perfil"}
    </Button>
  );
}

function getAvatarStyle(avatarUrl: string | null): CSSProperties | undefined {
  return avatarUrl
    ? { backgroundImage: `url(${JSON.stringify(avatarUrl)})` }
    : undefined;
}

export function ProfileSettingsForm({
  profile,
}: Readonly<{ profile: ProfileSettingsData }>) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateProfileSettingsAction,
    INITIAL_PROFILE_SETTINGS_STATE,
  );
  const initial =
    profile.displayName.trim().charAt(0).toLocaleUpperCase("pt-BR") || "L";

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <Card as="section" className="profile-settings-card">
      <form action={formAction} className="profile-settings-form">
        <div className="profile-avatar-editor">
          <span
            aria-hidden="true"
            className={`profile-avatar-preview${profile.avatarUrl ? " profile-avatar-preview--image" : ""}`}
            style={getAvatarStyle(profile.avatarUrl)}
          >
            {profile.avatarUrl ? null : initial}
          </span>

          <div className="profile-avatar-fields">
            <FormField
              error={state.fieldErrors.avatar?.[0]}
              hint="JPEG, PNG ou WebP, com no máximo 2 MB."
              htmlFor="profile-avatar"
              label="Avatar"
            >
              <Input
                accept="image/jpeg,image/png,image/webp"
                id="profile-avatar"
                name="avatar"
                type="file"
              />
            </FormField>

            {profile.avatarPath ? (
              <label className="profile-remove-avatar">
                <input name="removeAvatar" type="checkbox" value="true" />
                <span>Remover o avatar atual</span>
              </label>
            ) : null}
          </div>
        </div>

        <div className="profile-settings-grid">
          <FormField
            error={state.fieldErrors.displayName?.[0]}
            htmlFor="profile-display-name"
            label="Nome de exibição"
            required
          >
            <Input
              autoComplete="name"
              defaultValue={profile.displayName}
              id="profile-display-name"
              maxLength={80}
              name="displayName"
              required
            />
          </FormField>

          <FormField
            error={state.fieldErrors.timezone?.[0]}
            hint="Usado para apresentar datas e períodos das suas leituras."
            htmlFor="profile-timezone"
            label="Fuso horário"
            required
          >
            <Select
              defaultValue={profile.timezone}
              id="profile-timezone"
              name="timezone"
              required
            >
              {PROFILE_TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezoneLabels[timezone]} ({timezone})
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="profile-settings-actions">
          {state.message ? (
            <p
              className={`profile-settings-message profile-settings-message--${state.status}`}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </p>
          ) : null}
          <SaveButton />
        </div>
      </form>
    </Card>
  );
}
