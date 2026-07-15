"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { Badge, Button } from "@/components/ui";
import {
  formatProgressHistoryValue,
  parseProgressHistoryResponse,
  type ProgressHistoryItem,
  type ProgressHistoryPage,
} from "@/features/progress/domain/progress-history";
import type { Database } from "@/lib/supabase/database.types";

type ProgressUnit = Database["public"]["Enums"]["progress_unit"];

type ProgressHistoryProps = Readonly<{
  initialPage?: ProgressHistoryPage | undefined;
  progressUnit: ProgressUnit;
  timezone: string;
  title: string;
  workId: string;
}>;

function createDateFormatter(timezone: string) {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  };

  try {
    return new Intl.DateTimeFormat("pt-BR", options);
  } catch {
    return new Intl.DateTimeFormat("pt-BR", {
      ...options,
      timeZone: "America/Sao_Paulo",
    });
  }
}

function HistoryEvent({
  dateFormatter,
  event,
  progressUnit,
}: Readonly<{
  dateFormatter: Intl.DateTimeFormat;
  event: ProgressHistoryItem;
  progressUnit: ProgressUnit;
}>) {
  const isCorrection = event.eventType === "CORRECTION";

  return (
    <li
      className={
        isCorrection ? "progress-history-event--correction" : undefined
      }
    >
      <div className="progress-history-event__heading">
        <Badge tone={isCorrection ? "warning" : "neutral"}>
          {isCorrection ? "Correção" : "Atualização"}
        </Badge>
        <time dateTime={event.recordedAt}>
          {dateFormatter.format(new Date(event.recordedAt))}
        </time>
      </div>
      <p>
        <span>
          {formatProgressHistoryValue(event.previousValue, progressUnit)}
        </span>
        <span aria-hidden="true">→</span>
        <strong>
          {formatProgressHistoryValue(event.newValue, progressUnit)}
        </strong>
      </p>
    </li>
  );
}

export function ProgressHistory({
  initialPage,
  progressUnit,
  timezone,
  title,
  workId,
}: ProgressHistoryProps) {
  const [items, setItems] = useState<readonly ProgressHistoryItem[]>(
    initialPage?.items ?? [],
  );
  const [nextPage, setNextPage] = useState<number | null>(
    initialPage?.nextPage ?? 0,
  );
  const [total, setTotal] = useState<number | null>(initialPage?.total ?? null);
  const [hasLoaded, setHasLoaded] = useState(Boolean(initialPage));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const dateFormatter = useMemo(
    () => createDateFormatter(timezone),
    [timezone],
  );

  const loadPage = useCallback(
    async (page: number) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page: String(page), workId });
        const response = await fetch(`/api/progress/history?${params}`, {
          headers: { Accept: "application/json" },
        });
        const parsed = parseProgressHistoryResponse(await response.json());

        if (!response.ok || !parsed) {
          throw new Error("invalid history response");
        }

        setItems((currentItems) =>
          page === 0 ? parsed.items : [...currentItems, ...parsed.items],
        );
        setNextPage(parsed.nextPage);
        setTotal(parsed.total);
        setHasLoaded(true);
      } catch {
        setError("Não foi possível carregar o histórico. Tente novamente.");
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [workId],
  );

  return (
    <details
      className="work-progress-history"
      onToggle={(event) => {
        if (event.currentTarget.open && !hasLoaded && !loadingRef.current) {
          void loadPage(0);
        }
      }}
    >
      <summary>
        Histórico
        <span className="sr-only"> de {title}</span>
        {total === null ? null : (
          <span className="work-progress-history__count">{total}</span>
        )}
      </summary>

      <div className="work-progress-history__body">
        {isLoading && items.length === 0 ? (
          <p className="work-progress-history__state" role="status">
            Carregando histórico…
          </p>
        ) : null}

        {hasLoaded && items.length === 0 ? (
          <p className="work-progress-history__state">
            Nenhuma atualização registrada ainda.
          </p>
        ) : null}

        {items.length > 0 ? (
          <ol className="progress-history-list">
            {items.map((event) => (
              <HistoryEvent
                dateFormatter={dateFormatter}
                event={event}
                key={event.id}
                progressUnit={progressUnit}
              />
            ))}
          </ol>
        ) : null}

        {error ? (
          <p className="work-progress-history__error" role="alert">
            {error}
          </p>
        ) : null}

        {error || (hasLoaded && nextPage !== null) ? (
          <Button
            isLoading={isLoading}
            onClick={() =>
              void loadPage(error && !hasLoaded ? 0 : (nextPage ?? 0))
            }
            size="sm"
            variant="secondary"
          >
            {isLoading
              ? "Carregando…"
              : error
                ? "Tentar novamente"
                : "Carregar mais"}
          </Button>
        ) : null}
      </div>
    </details>
  );
}
