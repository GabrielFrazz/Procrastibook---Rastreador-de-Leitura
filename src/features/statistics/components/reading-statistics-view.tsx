import type { CSSProperties } from "react";
import Link from "next/link";

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import type { ReadingStatistics } from "@/features/statistics/domain/reading-statistics";

export type StatisticsResult =
  | Readonly<{ status: "error" }>
  | Readonly<{ data: ReadingStatistics; status: "success" }>;

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function MetricCard({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="statistics-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StatusDistribution({
  statistics,
}: Readonly<{ statistics: ReadingStatistics }>) {
  const items = [
    {
      count: statistics.statusCounts.wantToRead,
      label: "Quero ler",
      tone: "oat",
    },
    { count: statistics.statusCounts.reading, label: "Lendo", tone: "sage" },
    {
      count: statistics.statusCounts.finished,
      label: "Finalizadas",
      tone: "cocoa",
    },
    {
      count: statistics.statusCounts.abandoned,
      label: "Abandonadas",
      tone: "clay",
    },
  ];

  return (
    <section
      aria-labelledby="statistics-status-title"
      className="statistics-status-panel"
    >
      <div className="statistics-section-heading">
        <div>
          <p>Biblioteca</p>
          <h2 id="statistics-status-title">Distribuição por status</h2>
        </div>
        <Badge>{statistics.totalWorks} obras</Badge>
      </div>
      <ul className="statistics-status-list">
        {items.map((item) => {
          const percent =
            statistics.totalWorks === 0
              ? 0
              : Math.round((item.count / statistics.totalWorks) * 100);
          return (
            <li
              className={`statistics-status-item statistics-status-item--${item.tone}`}
              key={item.label}
            >
              <div>
                <span>{item.label}</span>
                <strong>
                  {item.count} <small>({percent}%)</small>
                </strong>
              </div>
              <progress
                aria-label={`${item.label}: ${item.count} de ${statistics.totalWorks}`}
                max={Math.max(1, statistics.totalWorks)}
                value={item.count}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ActivityChart({
  statistics,
}: Readonly<{ statistics: ReadingStatistics }>) {
  const maximumMinutes = Math.max(
    1,
    ...statistics.activity.map((item) => item.minutesRead),
  );
  const activityMinutes = statistics.activity.reduce(
    (total, item) => total + item.minutesRead,
    0,
  );

  return (
    <section
      aria-labelledby="statistics-activity-title"
      className="statistics-activity-panel"
    >
      <div className="statistics-section-heading">
        <div>
          <p>Últimos seis meses</p>
          <h2 id="statistics-activity-title">Tempo de leitura</h2>
        </div>
        <Badge tone="strong">{formatDuration(activityMinutes)}</Badge>
      </div>

      <ol className="statistics-chart" aria-label="Minutos de leitura por mês">
        {statistics.activity.map((item) => (
          <li
            aria-label={`${item.label}: ${item.minutesRead} minutos`}
            key={item.month}
            style={
              {
                "--statistics-bar-height": `${Math.max(4, (item.minutesRead / maximumMinutes) * 100)}%`,
              } as CSSProperties
            }
          >
            <strong>{item.minutesRead}</strong>
            <span aria-hidden="true" className="statistics-chart__bar" />
            <time dateTime={item.month}>{item.label}</time>
          </li>
        ))}
      </ol>

      <div className="statistics-table-wrap">
        <table className="statistics-table">
          <caption>Dados mensais detalhados</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">Minutos</th>
              <th scope="col">Páginas</th>
              <th scope="col">Capítulos</th>
              <th scope="col">Finalizadas</th>
            </tr>
          </thead>
          <tbody>
            {statistics.activity.map((item) => (
              <tr key={item.month}>
                <th scope="row">{item.label}</th>
                <td>{numberFormatter.format(item.minutesRead)}</td>
                <td>{numberFormatter.format(item.pagesRead)}</td>
                <td>{numberFormatter.format(item.chaptersRead)}</td>
                <td>{item.worksFinished}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopWorks({ statistics }: Readonly<{ statistics: ReadingStatistics }>) {
  return (
    <Card aria-labelledby="statistics-top-title" as="section">
      <div className="statistics-section-heading">
        <div>
          <p>Dedicação</p>
          <h2 id="statistics-top-title">Obras com mais tempo</h2>
        </div>
      </div>
      {statistics.topWorks.length === 0 ? (
        <p className="statistics-empty-copy">
          Registre sessões para comparar o tempo dedicado às obras.
        </p>
      ) : (
        <ol className="statistics-top-list">
          {statistics.topWorks.map((work, index) => (
            <li key={work.workId}>
              <span aria-hidden="true">{index + 1}</span>
              <strong>{work.title}</strong>
              <small>{formatDuration(work.minutesRead)}</small>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function ReadingStatisticsView({
  result,
}: Readonly<{ result: StatisticsResult }>) {
  if (result.status === "error") {
    return (
      <div className="statistics-page">
        <PageHeader
          description="Entenda sua atividade, ritmo e distribuição das leituras."
          eyebrow="Análise"
          title="Estatísticas"
        />
        <section className="statistics-feedback">
          <ErrorState
            description="Não foi possível calcular seus indicadores agora."
            retryHref="/statistics"
            title="Estatísticas indisponíveis"
          />
        </section>
      </div>
    );
  }

  const statistics = result.data;

  if (statistics.totalWorks === 0) {
    return (
      <div className="statistics-page">
        <PageHeader
          description="Entenda sua atividade, ritmo e distribuição das leituras."
          eyebrow="Análise"
          title="Estatísticas"
        />
        <section className="statistics-feedback">
          <EmptyState
            action={
              <Link
                className="ui-button ui-button--primary"
                href="/library/new"
              >
                Adicionar obra
              </Link>
            }
            description="Cadastre obras e registre seu progresso para construir um histórico de leitura."
            title="Ainda não há dados para analisar"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <PageHeader
        description="Entenda sua atividade, ritmo e distribuição das leituras."
        eyebrow="Análise"
        title="Estatísticas"
      />

      <dl className="statistics-metrics">
        <MetricCard
          label="Obras na biblioteca"
          value={`${statistics.totalWorks}`}
        />
        <MetricCard
          label="Páginas lidas"
          value={numberFormatter.format(statistics.pagesRead)}
        />
        <MetricCard
          label="Tempo registrado"
          value={formatDuration(statistics.minutesRead)}
        />
        <MetricCard
          label="Velocidade média"
          value={`${numberFormatter.format(statistics.readingSpeedPagesPerHour)} pág./h`}
        />
      </dl>

      <div className="statistics-layout">
        <div className="statistics-layout__main">
          <ActivityChart statistics={statistics} />
          <StatusDistribution statistics={statistics} />
        </div>
        <aside
          className="statistics-layout__side"
          aria-label="Indicadores complementares"
        >
          <section className="statistics-secondary">
            <div>
              <span>Capítulos lidos</span>
              <strong>{numberFormatter.format(statistics.chaptersRead)}</strong>
            </div>
            <div>
              <span>Avaliação média</span>
              <strong>
                {statistics.averageRating === 0
                  ? "Sem avaliações"
                  : `${numberFormatter.format(statistics.averageRating)} de 5`}
              </strong>
            </div>
          </section>
          <TopWorks statistics={statistics} />
        </aside>
      </div>
    </div>
  );
}
