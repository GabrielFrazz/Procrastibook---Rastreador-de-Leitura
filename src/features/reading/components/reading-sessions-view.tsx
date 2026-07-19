"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  Badge,
  Button,
  Card,
  DateInput,
  EmptyState,
  ErrorState,
  FormField,
  FormStatusMessage,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { createReadingSessionAction } from "@/features/reading/actions/create-reading-session-action";
import {
  formatReadingDuration,
  formatSessionDate,
  getReadingSessionUnitsRead,
  INITIAL_READING_SESSION_ACTION_STATE,
  type ReadingSessionActionState,
  type ReadingSessionItem,
  type ReadingSessionsData,
  type ReadingSessionWork,
} from "@/features/reading/domain/reading-sessions";
import { formatProgressHistoryValue } from "@/features/progress/domain/progress-history";

export type ReadingSessionsResult =
  | Readonly<{ status: "error" }>
  | Readonly<{ data: ReadingSessionsData; status: "success" }>;

type ReadingSessionsViewProps = Readonly<{
  formPreviewState?: ReadingSessionActionState | undefined;
  result: ReadingSessionsResult;
  today: string;
}>;

const unitLabels = {
  CHAPTER: "Até qual capítulo você leu?",
  PAGE: "Até qual página você leu?",
  PERCENT: "Até qual percentual você avançou?",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} type="submit">
      {pending ? "Registrando…" : "Registrar sessão"}
    </Button>
  );
}

function ActionMessage({
  state,
}: Readonly<{ state: ReadingSessionActionState }>) {
  return <FormStatusMessage message={state.message} status={state.status} />;
}

function PositionHint({ work }: Readonly<{ work: ReadingSessionWork }>) {
  const current = formatProgressHistoryValue(
    work.currentProgress,
    work.progressUnit,
  );
  const limit =
    work.totalProgress === null
      ? null
      : formatProgressHistoryValue(work.totalProgress, work.progressUnit);

  return (
    <span>
      A sessão começa no progresso atual, {current}, e atualiza a obra ao ser
      registrada.
      {limit ? ` · limite conhecido: ${limit}` : ""}
    </span>
  );
}

function ReadingSessionForm({
  initialState,
  today,
  works,
}: Readonly<{
  initialState: ReadingSessionActionState;
  today: string;
  works: readonly ReadingSessionWork[];
}>) {
  const [state, formAction] = useActionState(
    createReadingSessionAction,
    initialState,
  );
  const [selectedWorkId, setSelectedWorkId] = useState(works[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) ?? works[0],
    [selectedWorkId, works],
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }

    if (state.status === "error") {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    }
  }, [state]);

  if (!selectedWork) {
    return (
      <Card as="section" className="reading-session-no-works">
        <h2>Adicione uma obra primeiro</h2>
        <p>
          Uma sessão sempre pertence a uma obra e usa a mesma unidade de
          progresso dela.
        </p>
        <Link className="ui-button ui-button--primary" href="/library/new">
          Adicionar obra
        </Link>
      </Card>
    );
  }

  const positionLabel = unitLabels[selectedWork.progressUnit];

  return (
    <section
      aria-labelledby="reading-session-form-title"
      className="reading-session-form-card"
    >
      <div className="reading-session-section-heading">
        <p>Nova atividade</p>
        <h2 id="reading-session-form-title">Registrar sessão</h2>
      </div>

      <form
        action={formAction}
        className="reading-session-form"
        onReset={() => setSelectedWorkId(works[0]?.id ?? "")}
        ref={formRef}
      >
        <FormField
          error={state.fieldErrors.workId?.[0]}
          htmlFor="reading-session-work"
          label="Obra"
          required
        >
          <Select
            aria-describedby={
              state.fieldErrors.workId
                ? "reading-session-work-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.workId) || undefined}
            defaultValue={selectedWork.id}
            id="reading-session-work"
            name="workId"
            onChange={(event) => setSelectedWorkId(event.currentTarget.value)}
            required
          >
            {works.map((work) => (
              <option key={work.id} value={work.id}>
                {work.title}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={state.fieldErrors.occurredOn?.[0]}
          htmlFor="reading-session-date"
          label="Data"
          required
        >
          <DateInput
            aria-describedby={
              state.fieldErrors.occurredOn
                ? "reading-session-date-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.occurredOn) || undefined}
            defaultValue={today}
            id="reading-session-date"
            max={today}
            name="occurredOn"
            required
          />
        </FormField>

        <FormField
          error={state.fieldErrors.durationMinutes?.[0]}
          hint="Informe o tempo total entre 1 minuto e 24 horas."
          htmlFor="reading-session-duration"
          label="Duração em minutos"
          required
        >
          <Input
            aria-describedby={
              state.fieldErrors.durationMinutes
                ? "reading-session-duration-error"
                : "reading-session-duration-hint"
            }
            aria-invalid={
              Boolean(state.fieldErrors.durationMinutes) || undefined
            }
            id="reading-session-duration"
            inputMode="numeric"
            max={1_440}
            min={1}
            name="durationMinutes"
            placeholder="Ex.: 45"
            required
            type="number"
          />
        </FormField>

        <div className="reading-session-form__progress">
          <FormField
            error={state.fieldErrors.endPosition?.[0]}
            htmlFor="reading-session-end"
            label={positionLabel}
            required
          >
            <Input
              aria-describedby={
                state.fieldErrors.endPosition
                  ? "reading-session-end-error"
                  : undefined
              }
              aria-invalid={Boolean(state.fieldErrors.endPosition) || undefined}
              id="reading-session-end"
              inputMode="decimal"
              key={selectedWork.id}
              max={selectedWork.totalProgress ?? undefined}
              min={selectedWork.currentProgress + 0.01}
              name="endPosition"
              placeholder={`Maior que ${formatProgressHistoryValue(selectedWork.currentProgress, selectedWork.progressUnit)}`}
              required
              step="0.01"
              type="number"
            />
          </FormField>
        </div>

        <p className="reading-session-form__position-hint">
          <PositionHint work={selectedWork} />
        </p>

        <FormField
          error={state.fieldErrors.notes?.[0]}
          hint="Até 2.000 caracteres. Não use este campo para dados sensíveis."
          htmlFor="reading-session-notes"
          label="Anotações"
        >
          <Textarea
            aria-describedby={
              state.fieldErrors.notes
                ? "reading-session-notes-error"
                : "reading-session-notes-hint"
            }
            aria-invalid={Boolean(state.fieldErrors.notes) || undefined}
            id="reading-session-notes"
            maxLength={2_000}
            name="notes"
            placeholder="Como foi a leitura?"
          />
        </FormField>

        <div className="reading-session-form__actions">
          <ActionMessage state={state} />
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="reading-session-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SessionCard({ session }: Readonly<{ session: ReadingSessionItem }>) {
  const unitsRead = getReadingSessionUnitsRead(session);

  return (
    <article className="reading-session-card">
      <header>
        <div>
          <p>{formatSessionDate(session.occurredOn)}</p>
          <h3>{session.workTitle}</h3>
        </div>
        <Badge tone="strong">
          {formatReadingDuration(session.durationSeconds)}
        </Badge>
      </header>

      <dl>
        <div>
          <dt>Avanço</dt>
          <dd>
            {unitsRead > 0
              ? formatProgressHistoryValue(unitsRead, session.progressUnit)
              : "Não informado"}
          </dd>
        </div>
        <div>
          <dt>Intervalo</dt>
          <dd>
            {session.startPosition !== null && session.endPosition !== null
              ? `${formatProgressHistoryValue(session.startPosition, session.progressUnit)} → ${formatProgressHistoryValue(session.endPosition, session.progressUnit)}`
              : "Não informado"}
          </dd>
        </div>
      </dl>

      {session.notes ? (
        <p className="reading-session-card__notes">{session.notes}</p>
      ) : null}
    </article>
  );
}

export function ReadingSessionsView({
  formPreviewState = INITIAL_READING_SESSION_ACTION_STATE,
  result,
  today,
}: ReadingSessionsViewProps) {
  if (result.status === "error") {
    return (
      <div className="reading-sessions">
        <PageHeader
          description="Registre tempo e avanço de cada momento de leitura."
          eyebrow="Sua rotina"
          title="Sessões de leitura"
        />
        <ErrorState
          description="Não foi possível consultar suas sessões agora."
          retryHref="/sessions"
          title="Sessões indisponíveis"
        />
      </div>
    );
  }

  const { sessions, summary, works } = result.data;

  return (
    <div className="reading-sessions">
      <PageHeader
        description="Registre tempo e avanço de cada momento de leitura."
        eyebrow="Sua rotina"
        title="Sessões de leitura"
      />

      <section aria-labelledby="reading-session-summary-title">
        <div className="reading-session-section-heading reading-session-section-heading--summary">
          <div>
            <p>Visão acumulada</p>
            <h2 id="reading-session-summary-title">Resumo das sessões</h2>
          </div>
          <span>{summary.sessionCount} registros</span>
        </div>
        <div className="reading-session-summary-grid">
          <SummaryCard
            label="Tempo total"
            value={formatReadingDuration(summary.totalDurationSeconds)}
          />
          <SummaryCard label="Sessões" value={String(summary.sessionCount)} />
          <SummaryCard label="Páginas" value={String(summary.pagesRead)} />
          <SummaryCard label="Capítulos" value={String(summary.chaptersRead)} />
          <SummaryCard
            label="Avanço percentual"
            value={`${summary.percentPointsRead}%`}
          />
        </div>
      </section>

      <ReadingSessionForm
        initialState={formPreviewState}
        today={today}
        works={works}
      />

      <section aria-labelledby="reading-session-list-title">
        <div className="reading-session-section-heading reading-session-section-heading--results">
          <div>
            <p>Atividade registrada</p>
            <h2 id="reading-session-list-title">Sessões recentes</h2>
          </div>
          <span>
            {sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}
          </span>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            description="Use o formulário acima para registrar tempo e avanço da sua próxima leitura."
            title="Nenhuma sessão registrada"
          />
        ) : (
          <div className="reading-session-list">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
