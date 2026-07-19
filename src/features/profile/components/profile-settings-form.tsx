"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  FormField,
  FormStatusMessage,
  Input,
  Select,
} from "@/components/ui";
import { updateProfileSettingsAction } from "@/features/profile/actions/profile-settings-action";
import { AvatarEditor } from "@/features/profile/components/avatar-editor";
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

function SaveButton({ disabled }: Readonly<{ disabled: boolean }>) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled} isLoading={pending} type="submit">
      {pending ? "Salvando…" : "Salvar perfil"}
    </Button>
  );
}

export function ProfileSettingsForm({
  profile,
}: Readonly<{ profile: ProfileSettingsData }>) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateProfileSettingsAction,
    INITIAL_PROFILE_SETTINGS_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [isAvatarCropPending, setIsAvatarCropPending] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }

    if (state.status === "error") {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    }
  }, [router, state]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isAvatarCropPending) {
      event.preventDefault();
      formRef.current
        ?.querySelector<HTMLButtonElement>("[data-avatar-apply]")
        ?.focus();
    }
  };

  return (
    <section
      aria-labelledby="profile-settings-title"
      className="profile-settings-card"
    >
      <div className="profile-settings-intro">
        <p>Identidade e preferências</p>
        <h2 id="profile-settings-title">Como você aparece por aqui</h2>
        <span>
          Seu nome e fuso são usados nos registros pessoais de leitura.
        </span>
      </div>

      <form
        action={formAction}
        className="profile-settings-form"
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <AvatarEditor
          avatarPath={profile.avatarPath}
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          onCropPendingChange={setIsAvatarCropPending}
          serverError={state.fieldErrors.avatar?.[0]}
        />

        <div className="profile-settings-grid">
          <FormField
            error={state.fieldErrors.displayName?.[0]}
            htmlFor="profile-display-name"
            label="Nome de exibição"
            required
          >
            <Input
              aria-describedby={
                state.fieldErrors.displayName
                  ? "profile-display-name-error"
                  : undefined
              }
              aria-invalid={Boolean(state.fieldErrors.displayName) || undefined}
              autoComplete="name"
              defaultValue={profile.displayName}
              id="profile-display-name"
              maxLength={80}
              name="displayName"
              placeholder="Ex.: Gabriel"
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
              aria-describedby={
                state.fieldErrors.timezone
                  ? "profile-timezone-error"
                  : "profile-timezone-hint"
              }
              aria-invalid={Boolean(state.fieldErrors.timezone) || undefined}
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
          <FormStatusMessage message={state.message} status={state.status} />
          <SaveButton disabled={isAvatarCropPending} />
        </div>
      </form>
    </section>
  );
}
