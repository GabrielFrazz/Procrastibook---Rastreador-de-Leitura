import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/feedback-state";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { BookCover } from "@/components/ui/media-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import type {
  DashboardCurrentWork,
  DashboardGoal,
  DashboardRecentSession,
  DashboardSummary,
} from "@/features/dashboard/domain/dashboard-summary";

type DashboardResult =
  | Readonly<{ status: "success"; summary: DashboardSummary }>
  | Readonly<{ status: "error" }>;

type DashboardViewProps = Readonly<{
  authError?: string;
  notice?: string;
  result: DashboardResult;
  timezone?: string;
}>;

type DashboardIconName = "book" | "clock" | "pages" | "speed";

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

const goalLabels: Record<DashboardGoal["metric"], string> = {
  WORKS_FINISHED: "Obras finalizadas",
  PAGES_READ: "Páginas lidas",
  CHAPTERS_READ: "Capítulos lidos",
  MINUTES_READ: "Minutos de leitura",
};

const workTypeLabels: Record<DashboardCurrentWork["type"], string> = {
  BOOK: "Livro",
  MANGA: "Mangá",
  ARTICLE: "Artigo",
  EBOOK: "E-book",
};

function DashboardIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: DashboardIconName }) {
  const paths: Record<DashboardIconName, ReactNode> = {
    book: (
      <path d="M5 4h5.5A2.5 2.5 0 0 1 13 6.5V20a2.5 2.5 0 0 0-2.5-2.5H5V4Zm14 0h-3.5A2.5 2.5 0 0 0 13 6.5V20a2.5 2.5 0 0 1 2.5-2.5H19V4Z" />
    ),
    clock: <path d="M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    pages: <path d="M7 3h10v4H7V3ZM5 7h14v14H5V7Zm4 4h6m-6 4h6" />,
    speed: <path d="M4 17a8 8 0 1 1 16 0M12 17l4-5m-9 5h10" />,
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${numberFormatter.format(totalMinutes)} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function formatDate(date: string, timezone: string) {
  const normalizedDate = date.length === 10 ? `${date}T12:00:00.000Z` : date;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  }).format(new Date(normalizedDate));
}

function getUnitLabel(
  unit: DashboardCurrentWork["progressUnit"],
  value: number,
) {
  if (unit === "PERCENT") {
    return "%";
  }

  if (unit === "CHAPTER") {
    return value === 1 ? "capítulo" : "capítulos";
  }

  return value === 1 ? "página" : "páginas";
}

function getSessionDescription(session: DashboardRecentSession) {
  if (session.unitsRead <= 0) {
    return formatDuration(session.durationMinutes);
  }

  const unit = getUnitLabel(session.progressUnit, session.unitsRead);
  const amount =
    session.progressUnit === "PERCENT"
      ? `${numberFormatter.format(session.unitsRead)}%`
      : `${numberFormatter.format(session.unitsRead)} ${unit}`;

  return `${amount} em ${formatDuration(session.durationMinutes)}`;
}

function DashboardMetric({
  icon,
  label,
  value,
}: Readonly<{
  icon: DashboardIconName;
  label: string;
  value: string;
}>) {
  return (
    <div className={`dashboard-metric dashboard-metric--${icon}`}>
      <span className="dashboard-metric__icon">
        <DashboardIcon name={icon} />
      </span>
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}

function DashboardMetrics({
  summary,
}: Readonly<{ summary: DashboardSummary }>) {
  return (
    <dl className="dashboard-metrics" aria-label="Resumo de leitura">
      <DashboardMetric
        icon="book"
        label="Em leitura"
        value={numberFormatter.format(summary.statusCounts.reading)}
      />
      <DashboardMetric
        icon="pages"
        label="Páginas lidas"
        value={numberFormatter.format(summary.pagesRead)}
      />
      <DashboardMetric
        icon="clock"
        label="Tempo registrado"
        value={formatDuration(summary.minutesRead)}
      />
      <DashboardMetric
        icon="speed"
        label="Ritmo médio"
        value={`${numberFormatter.format(summary.readingSpeedPagesPerHour)} pág/h`}
      />
    </dl>
  );
}

function CurrentWork({ work }: Readonly<{ work: DashboardCurrentWork }>) {
  const progressValue = numberFormatter.format(work.currentProgress);
  const totalValue =
    work.totalProgress === null
      ? null
      : numberFormatter.format(work.totalProgress);
  const valueLabel =
    work.progressUnit === "PERCENT"
      ? `${progressValue}%`
      : totalValue
        ? `${progressValue} de ${totalValue} ${getUnitLabel(work.progressUnit, work.totalProgress ?? 0)}`
        : `${progressValue} ${getUnitLabel(work.progressUnit, work.currentProgress)}`;

  return (
    <li className="dashboard-work">
      <BookCover
        alt=""
        className="dashboard-work__cover"
        size="sm"
        src={work.coverUrl}
        title={work.title}
      />
      <div className="dashboard-work__content">
        <div className="dashboard-work__heading">
          <div>
            <h3>{work.title}</h3>
            <p>{workTypeLabels[work.type]}</p>
          </div>
          <Badge tone="neutral">Lendo</Badge>
        </div>
        {work.totalProgress === null ? (
          <p className="dashboard-work__unknown-progress">
            {valueLabel} registradas; total ainda não informado.
          </p>
        ) : (
          <Progress
            ariaLabel={`Progresso de ${work.title}`}
            label="Progresso"
            max={work.totalProgress}
            value={work.currentProgress}
            valueLabel={valueLabel}
          />
        )}
      </div>
    </li>
  );
}

function ReadingSection({ summary }: Readonly<{ summary: DashboardSummary }>) {
  return (
    <section
      className="dashboard-reading"
      aria-labelledby="dashboard-current-title"
    >
      <div className="dashboard-section__header">
        <div>
          <p className="dashboard-section__eyebrow">Em andamento</p>
          <h2 id="dashboard-current-title">Continuar lendo</h2>
        </div>
        <Badge>
          {summary.statusCounts.reading}{" "}
          {summary.statusCounts.reading === 1 ? "ativa" : "ativas"}
        </Badge>
      </div>
      {summary.currentWorks.length > 0 ? (
        <ul className="dashboard-work-list">
          {summary.currentWorks.map((work) => (
            <CurrentWork key={work.id} work={work} />
          ))}
        </ul>
      ) : (
        <p className="dashboard-section__empty">
          Nenhuma obra está marcada como leitura atual.
        </p>
      )}
    </section>
  );
}

function ActivitySection({
  sessions,
  timezone,
}: Readonly<{
  sessions: DashboardSummary["recentSessions"];
  timezone: string;
}>) {
  return (
    <section
      className="dashboard-activity"
      aria-labelledby="dashboard-sessions-title"
    >
      <div className="dashboard-section__header">
        <div>
          <p className="dashboard-section__eyebrow">Atividade</p>
          <h2 id="dashboard-sessions-title">Sessões recentes</h2>
        </div>
      </div>
      {sessions.length > 0 ? (
        <ol className="dashboard-activity-list">
          {sessions.map((session) => (
            <li key={session.id}>
              <span aria-hidden="true" className="dashboard-activity__marker" />
              <div>
                <strong>{session.workTitle}</strong>
                <p>{getSessionDescription(session)}</p>
              </div>
              <time dateTime={session.occurredOn}>
                {formatDate(session.occurredOn, timezone)}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="dashboard-section__empty">
          Suas sessões registradas aparecerão aqui.
        </p>
      )}
    </section>
  );
}

function GoalSection({
  goal,
  timezone,
}: Readonly<{ goal: DashboardGoal | null; timezone: string }>) {
  if (!goal) {
    return (
      <section
        className="dashboard-goal"
        aria-labelledby="dashboard-goal-title"
      >
        <div className="dashboard-section__header">
          <div>
            <p className="dashboard-section__eyebrow">Meta atual</p>
            <h2 id="dashboard-goal-title">Sem meta ativa</h2>
          </div>
        </div>
        <p className="dashboard-section__empty">
          Quando uma meta estiver dentro do período, o progresso aparecerá aqui.
        </p>
      </section>
    );
  }

  const current = numberFormatter.format(goal.currentValue);
  const target = numberFormatter.format(goal.targetValue);
  const isComplete = goal.progressPercent >= 100;

  return (
    <section className="dashboard-goal" aria-labelledby="dashboard-goal-title">
      <div className="dashboard-section__header">
        <div>
          <p className="dashboard-section__eyebrow">Meta atual</p>
          <h2 id="dashboard-goal-title">{goalLabels[goal.metric]}</h2>
        </div>
        <Badge tone={isComplete ? "success" : "neutral"}>
          {isComplete ? "Concluída" : "Em andamento"}
        </Badge>
      </div>
      <p className="dashboard-goal__percentage">
        <strong>{numberFormatter.format(goal.progressPercent)}%</strong>
        <span>do objetivo alcançado</span>
      </p>
      <Progress
        label={goalLabels[goal.metric]}
        max={goal.targetValue}
        value={goal.currentValue}
        valueLabel={`${current} de ${target}`}
      />
      <p className="dashboard-goal__deadline">
        Período até {formatDate(goal.periodEnd, timezone)}
      </p>
    </section>
  );
}

function DashboardRail({
  summary,
  timezone,
}: Readonly<{ summary: DashboardSummary; timezone: string }>) {
  return (
    <aside className="dashboard-rail" aria-label="Resumo complementar">
      <GoalSection goal={summary.activeGoal} timezone={timezone} />

      <section
        className="dashboard-rail__section"
        aria-labelledby="dashboard-status-title"
      >
        <div className="dashboard-section__header">
          <div>
            <p className="dashboard-section__eyebrow">Biblioteca</p>
            <h2 id="dashboard-status-title">Status das obras</h2>
          </div>
        </div>
        <ul className="dashboard-status-list">
          <li>
            <span>Quero ler</span>
            <strong>{summary.statusCounts.wantToRead}</strong>
          </li>
          <li>
            <span>Lendo</span>
            <strong>{summary.statusCounts.reading}</strong>
          </li>
          <li>
            <span>Finalizadas</span>
            <strong>{summary.statusCounts.finished}</strong>
          </li>
          <li>
            <span>Abandonadas</span>
            <strong>{summary.statusCounts.abandoned}</strong>
          </li>
        </ul>
      </section>

      <section
        className="dashboard-rail__section dashboard-rail__reviews"
        aria-labelledby="dashboard-reviews-title"
      >
        <div className="dashboard-section__header">
          <div>
            <p className="dashboard-section__eyebrow">Impressões</p>
            <h2 id="dashboard-reviews-title">Avaliações recentes</h2>
          </div>
        </div>
        {summary.recentReviews.length > 0 ? (
          <ul className="dashboard-review-list">
            {summary.recentReviews.map((review) => (
              <li key={review.id}>
                <div>
                  <strong>{review.workTitle}</strong>
                  <time dateTime={review.updatedAt}>
                    {formatDate(review.updatedAt, timezone)}
                  </time>
                </div>
                <span
                  aria-label={`Avaliação ${numberFormatter.format(review.rating)} de 5`}
                >
                  ★ {numberFormatter.format(review.rating)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-section__empty">
            Suas avaliações mais recentes aparecerão aqui.
          </p>
        )}
      </section>
    </aside>
  );
}

function DashboardContent({
  summary,
  timezone,
}: Readonly<{ summary: DashboardSummary; timezone: string }>) {
  if (summary.totalWorks === 0) {
    return (
      <section className="dashboard-feedback" aria-label="Dashboard vazio">
        <EmptyState
          action={
            <Link className="ui-button ui-button--primary" href="/library/new">
              Adicionar primeira obra
            </Link>
          }
          description="Quando suas obras forem cadastradas, este espaço mostrará progresso, sessões, metas e avaliações."
          title="Sua estante começa aqui"
        />
      </section>
    );
  }

  return (
    <div className="dashboard-overview">
      <ReadingSection summary={summary} />
      <DashboardMetrics summary={summary} />
      <ActivitySection sessions={summary.recentSessions} timezone={timezone} />
      <DashboardRail summary={summary} timezone={timezone} />
    </div>
  );
}

export function DashboardView({
  authError,
  notice,
  result,
  timezone = "America/Sao_Paulo",
}: DashboardViewProps) {
  return (
    <div className="dashboard">
      <PageHeader
        description="Retome suas leituras, acompanhe seu ritmo e veja o que mudou recentemente."
        eyebrow="Sua leitura, sem pressa"
        title="Visão geral"
      />

      {authError === "logout" ? (
        <FormStatusMessage
          message="Não foi possível encerrar a sessão. Tente novamente."
          status="error"
        />
      ) : null}
      {notice === "password-updated" ? (
        <FormStatusMessage
          message="Senha atualizada com segurança."
          status="success"
        />
      ) : null}

      {result.status === "error" ? (
        <section className="dashboard-feedback" aria-label="Falha no dashboard">
          <ErrorState
            description="Não conseguimos consultar seus dados agora. Sua biblioteca não foi alterada."
            retryHref="/dashboard"
            title="O resumo não pôde ser carregado"
          />
        </section>
      ) : (
        <DashboardContent summary={result.summary} timezone={timezone} />
      )}
    </div>
  );
}
