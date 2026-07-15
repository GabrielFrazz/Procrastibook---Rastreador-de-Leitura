"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, FormField, Input, Select } from "@/components/ui";
import type { LibraryWork } from "@/features/library/domain/library-catalog";
import { recordProgressAction } from "@/features/progress/actions/record-progress-action";
import {
  INITIAL_PROGRESS_ACTION_STATE,
  type ProgressActionState,
} from "@/features/progress/domain/progress-form";

type WorkProgressFormProps = Readonly<
  Pick<
    LibraryWork,
    "currentProgress" | "id" | "progressUnit" | "title" | "totalProgress"
  >
>;

const unitLabels = {
  CHAPTER: "capítulos",
  PAGE: "páginas",
  PERCENT: "%",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} size="sm" type="submit">
      {pending ? "Atualizando…" : "Salvar progresso"}
    </Button>
  );
}

function getError(state: ProgressActionState) {
  return state.fieldErrors.newValue?.[0];
}

export function WorkProgressForm({
  currentProgress,
  id,
  progressUnit,
  title,
  totalProgress,
}: WorkProgressFormProps) {
  const [state, formAction] = useActionState(
    recordProgressAction,
    INITIAL_PROGRESS_ACTION_STATE,
  );
  const inputId = `progress-${id}`;
  const eventId = `progress-event-${id}`;
  const error = getError(state);

  return (
    <details className="work-progress-form">
      <summary>
        Atualizar progresso
        <span className="sr-only"> de {title}</span>
      </summary>
      <form action={formAction}>
        <input name="workId" type="hidden" value={id} />
        <input
          name="expectedPreviousValue"
          type="hidden"
          value={currentProgress}
        />

        <FormField
          error={error}
          hint={`Valor atual: ${currentProgress} ${unitLabels[progressUnit]}.`}
          htmlFor={inputId}
          label="Novo progresso"
          required
        >
          <Input
            aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
            aria-invalid={Boolean(error) || undefined}
            defaultValue={currentProgress}
            id={inputId}
            inputMode="decimal"
            max={totalProgress ?? 99_999_999.99}
            min={0}
            name="newValue"
            required
            step="0.01"
            type="number"
          />
        </FormField>

        <FormField
          hint="Use correção sempre que o valor diminuir."
          htmlFor={eventId}
          label="Tipo de registro"
          required
        >
          <Select
            aria-describedby={`${eventId}-hint`}
            defaultValue="UPDATE"
            id={eventId}
            name="eventType"
          >
            <option value="UPDATE">Atualização normal</option>
            <option value="CORRECTION">Correção de registro</option>
          </Select>
        </FormField>

        {state.message ? (
          <p
            className={`work-progress-form__message work-progress-form__message--${state.status}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </details>
  );
}
