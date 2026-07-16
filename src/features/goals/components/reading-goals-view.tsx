"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  PageHeader,
  Progress,
  Select,
} from "@/components/ui";
import { manageReadingGoalAction } from "@/features/goals/actions/reading-goal-actions";
import {
  INITIAL_GOAL_ACTION_STATE,
  type GoalActionState,
  type GoalMetric,
  type GoalsData,
  type GoalStatus,
  type GoalSummary,
} from "@/features/goals/domain/reading-goals";

export type GoalsResult =
  | Readonly<{ status: "error" }>
  | Readonly<{ data: GoalsData; status: "success" }>;

const metricLabels: Record<GoalMetric, string> = {
  CHAPTERS_READ: "Capítulos lidos",
  MINUTES_READ: "Minutos de leitura",
  PAGES_READ: "Páginas lidas",
  WORKS_FINISHED: "Obras finalizadas",
};

const statusLabels: Record<GoalStatus, string> = {
  ACTIVE: "Em andamento",
  COMPLETED: "Concluída",
  EXPIRED: "Encerrada",
  UPCOMING: "Agendada",
};

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 12)),
  );
}

function ActionMessage({ state }: Readonly<{ state: GoalActionState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`goal-message goal-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: Readonly<{
  children: string;
  pendingLabel: string;
  variant?: "danger" | "primary" | "secondary";
}>) {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} type="submit" variant={variant}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

function MetricOptions() {
  return Object.entries(metricLabels).map(([metric, label]) => (
    <option key={metric} value={metric}>
      {label}
    </option>
  ));
}

function GoalFields({
  idPrefix,
  initialGoal,
  state,
  today,
}: Readonly<{
  idPrefix: string;
  initialGoal?: GoalSummary;
  state: GoalActionState;
  today: string;
}>) {
  const targetId = `${idPrefix}-target`;
  const metricId = `${idPrefix}-metric`;
  const startId = `${idPrefix}-start`;
  const endId = `${idPrefix}-end`;

  return (
    <div className="goal-form__fields">
      <FormField
        error={state.fieldErrors.metric?.[0]}
        htmlFor={metricId}
        label="Métrica"
        required
      >
        <Select
          aria-describedby={
            state.fieldErrors.metric ? `${metricId}-error` : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.metric) || undefined}
          defaultValue={initialGoal?.metric ?? "PAGES_READ"}
          id={metricId}
          name="metric"
          required
        >
          <MetricOptions />
        </Select>
      </FormField>

      <FormField
        error={state.fieldErrors.targetValue?.[0]}
        hint="Valor positivo, com até duas casas decimais."
        htmlFor={targetId}
        label="Objetivo"
        required
      >
        <Input
          aria-describedby={
            state.fieldErrors.targetValue
              ? `${targetId}-error`
              : `${targetId}-hint`
          }
          aria-invalid={Boolean(state.fieldErrors.targetValue) || undefined}
          defaultValue={initialGoal?.targetValue ?? ""}
          id={targetId}
          inputMode="decimal"
          max="9999999999.99"
          min="0.01"
          name="targetValue"
          placeholder="Ex.: 1200"
          required
          step="0.01"
          type="number"
        />
      </FormField>

      <FormField
        error={state.fieldErrors.periodStart?.[0]}
        htmlFor={startId}
        label="Início"
        required
      >
        <Input
          aria-describedby={
            state.fieldErrors.periodStart ? `${startId}-error` : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.periodStart) || undefined}
          defaultValue={initialGoal?.periodStart ?? today}
          id={startId}
          name="periodStart"
          required
          type="date"
        />
      </FormField>

      <FormField
        error={state.fieldErrors.periodEnd?.[0]}
        htmlFor={endId}
        label="Fim"
        required
      >
        <Input
          aria-describedby={
            state.fieldErrors.periodEnd ? `${endId}-error` : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.periodEnd) || undefined}
          defaultValue={initialGoal?.periodEnd ?? `${today.slice(0, 4)}-12-31`}
          id={endId}
          name="periodEnd"
          required
          type="date"
        />
      </FormField>
    </div>
  );
}

function CreateGoalForm({
  previewState,
  today,
}: Readonly<{ previewState?: GoalActionState; today: string }>) {
  const [actionState, formAction] = useActionState(
    manageReadingGoalAction,
    INITIAL_GOAL_ACTION_STATE,
  );
  const state = previewState ?? actionState;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!previewState && actionState.status === "success") {
      formRef.current?.reset();
    }
  }, [actionState.status, actionState.message, previewState]);

  return (
    <Card
      aria-labelledby="create-goal-title"
      as="section"
      className="goal-create"
    >
      <div className="goal-section-heading">
        <div>
          <p>Planejamento</p>
          <h2 id="create-goal-title">Criar uma meta</h2>
        </div>
        <span>O progresso é calculado pelos seus registros.</span>
      </div>

      <form action={formAction} className="goal-form" ref={formRef}>
        <input name="intent" type="hidden" value="CREATE" />
        <GoalFields idPrefix="create-goal" state={state} today={today} />
        <div className="goal-form__actions">
          <ActionMessage state={state} />
          <SubmitButton pendingLabel="Criando…">Criar meta</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function GoalCard({
  goal,
  today,
}: Readonly<{ goal: GoalSummary; today: string }>) {
  const [state, formAction] = useActionState(
    manageReadingGoalAction,
    INITIAL_GOAL_ACTION_STATE,
  );
  const tone =
    goal.status === "COMPLETED"
      ? "success"
      : goal.status === "ACTIVE"
        ? "strong"
        : goal.status === "UPCOMING"
          ? "warning"
          : "neutral";

  return (
    <Card as="article" className="goal-card">
      <header className="goal-card__header">
        <div>
          <p>{metricLabels[goal.metric]}</p>
          <h3>{numberFormatter.format(goal.targetValue)}</h3>
        </div>
        <Badge tone={tone}>{statusLabels[goal.status]}</Badge>
      </header>

      <Progress
        ariaLabel={`Progresso da meta de ${metricLabels[goal.metric]}`}
        label="Progresso"
        max={goal.targetValue}
        value={goal.currentValue}
        valueLabel={`${numberFormatter.format(goal.currentValue)} de ${numberFormatter.format(goal.targetValue)}`}
      />

      <p className="goal-card__period">
        <time dateTime={goal.periodStart}>{formatDate(goal.periodStart)}</time>
        <span aria-hidden="true">→</span>
        <time dateTime={goal.periodEnd}>{formatDate(goal.periodEnd)}</time>
      </p>

      <ActionMessage state={state} />

      <details className="goal-card__editor">
        <summary>Editar meta</summary>
        <form action={formAction} className="goal-form goal-form--compact">
          <input name="goalId" type="hidden" value={goal.id} />
          <input name="intent" type="hidden" value="UPDATE" />
          <GoalFields
            idPrefix={`goal-${goal.id}`}
            initialGoal={goal}
            state={state}
            today={today}
          />
          <div className="goal-form__actions">
            <SubmitButton pendingLabel="Salvando…" variant="secondary">
              Salvar alterações
            </SubmitButton>
          </div>
        </form>
      </details>

      <form
        action={formAction}
        className="goal-card__delete"
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Excluir esta meta? Os registros de leitura serão preservados.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input name="goalId" type="hidden" value={goal.id} />
        <input name="intent" type="hidden" value="DELETE" />
        <SubmitButton pendingLabel="Excluindo…" variant="danger">
          Excluir meta
        </SubmitButton>
      </form>
    </Card>
  );
}

export function ReadingGoalsView({
  formPreviewState,
  result,
  today,
}: Readonly<{
  formPreviewState?: GoalActionState;
  result: GoalsResult;
  today: string;
}>) {
  if (result.status === "error") {
    return (
      <div className="goals-page">
        <PageHeader
          description="Defina objetivos por período e acompanhe o resultado a partir das suas leituras."
          eyebrow="Planejamento"
          title="Metas de leitura"
        />
        <Card as="section">
          <ErrorState
            description="Não foi possível consultar suas metas agora."
            retryHref="/goals"
            title="Metas indisponíveis"
          />
        </Card>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="goals-page">
      <PageHeader
        description="Defina objetivos por período e acompanhe o resultado a partir das suas leituras."
        eyebrow="Planejamento"
        title="Metas de leitura"
      />

      <dl className="goal-overview">
        <Card as="div" className="goal-overview__item">
          <dt>Total</dt>
          <dd>{data.overview.total}</dd>
        </Card>
        <Card as="div" className="goal-overview__item">
          <dt>Em andamento</dt>
          <dd>{data.overview.active}</dd>
        </Card>
        <Card as="div" className="goal-overview__item">
          <dt>Concluídas</dt>
          <dd>{data.overview.completed}</dd>
        </Card>
      </dl>

      <CreateGoalForm
        {...(formPreviewState ? { previewState: formPreviewState } : {})}
        today={today}
      />

      <section aria-labelledby="goal-list-title">
        <div className="goal-section-heading">
          <div>
            <p>Acompanhamento</p>
            <h2 id="goal-list-title">Suas metas</h2>
          </div>
          <span>{data.goals.length} cadastradas</span>
        </div>

        {data.goals.length === 0 ? (
          <Card as="div">
            <EmptyState
              description="Crie uma meta acima para começar a acompanhar páginas, capítulos, minutos ou obras finalizadas."
              title="Nenhuma meta cadastrada"
            />
          </Card>
        ) : (
          <div className="goal-list">
            {data.goals.map((goal) => (
              <GoalCard goal={goal} key={goal.id} today={today} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
