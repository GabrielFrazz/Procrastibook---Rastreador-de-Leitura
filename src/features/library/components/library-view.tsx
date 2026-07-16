"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Badge,
  BookCover,
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
import {
  filterAndSortLibraryWorks,
  type LibrarySort,
  type LibraryWork,
} from "@/features/library/domain/library-catalog";
import { ProgressHistory } from "@/features/progress/components/progress-history";
import { WorkProgressForm } from "@/features/progress/components/work-progress-form";
import type { ProgressHistoryPage } from "@/features/progress/domain/progress-history";

export type LibraryResult =
  | Readonly<{ status: "error" }>
  | Readonly<{ status: "success"; works: readonly LibraryWork[] }>;

type LibraryViewProps = Readonly<{
  historyPreview?: Readonly<Record<string, ProgressHistoryPage>>;
  initialQuery?: string;
  initialStatus?: "ALL" | LibraryWork["status"];
  notice?: string;
  result: LibraryResult;
  timezone?: string;
}>;

const statusLabels = {
  ABANDONED: "Abandonada",
  FINISHED: "Finalizada",
  READING: "Lendo",
  WANT_TO_READ: "Quero ler",
} as const;

const typeLabels = {
  ARTICLE: "Artigo",
  BOOK: "Livro",
  EBOOK: "E-book",
  MANGA: "Mangá",
} as const;

const unitLabels = {
  CHAPTER: ["capítulo", "capítulos"],
  PAGE: ["página", "páginas"],
  PERCENT: ["por cento", "por cento"],
} as const;

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

function getStatusTone(status: LibraryWork["status"]) {
  if (status === "READING") {
    return "strong" as const;
  }

  if (status === "FINISHED") {
    return "success" as const;
  }

  if (status === "ABANDONED") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function formatProgressValue(work: LibraryWork) {
  if (work.progressUnit === "PERCENT") {
    return `${numberFormatter.format(work.currentProgress)}%`;
  }

  const labels = unitLabels[work.progressUnit];
  const unit = work.currentProgress === 1 ? labels[0] : labels[1];
  const current = `${numberFormatter.format(work.currentProgress)} ${unit}`;

  if (work.totalProgress === null) {
    return current;
  }

  const totalUnit = work.totalProgress === 1 ? labels[0] : labels[1];

  return `${numberFormatter.format(work.currentProgress)} de ${numberFormatter.format(work.totalProgress)} ${totalUnit}`;
}

function LibraryCard({
  historyPreview,
  timezone,
  work,
}: Readonly<{
  historyPreview?: ProgressHistoryPage | undefined;
  timezone: string;
  work: LibraryWork;
}>) {
  return (
    <Card as="article" className="library-card" padded={false}>
      <div className="library-card__summary">
        <BookCover
          alt=""
          className="library-card__cover"
          size="md"
          src={work.coverUrl}
          title={work.title}
        />

        <div className="library-card__metadata">
          <div className="library-card__badges">
            <Badge>{typeLabels[work.type]}</Badge>
            {work.genres[0] ? <span>{work.genres[0]}</span> : null}
          </div>
          <h2>
            <Link href={`/library/${work.id}`}>{work.title}</Link>
          </h2>
          <p className="library-card__authors">
            {work.authors.length > 0
              ? work.authors.join(", ")
              : "Autoria não informada"}
          </p>
          <div className="library-card__footer">
            <Badge tone={getStatusTone(work.status)}>
              {statusLabels[work.status]}
            </Badge>
            {work.rating === null ? (
              <span className="library-card__rating library-card__rating--empty">
                Sem avaliação
              </span>
            ) : (
              <span
                aria-label={`Avaliação ${numberFormatter.format(work.rating)} de 5`}
                className="library-card__rating"
              >
                <span aria-hidden="true">★</span>{" "}
                {numberFormatter.format(work.rating)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="library-card__reading">
        {work.progressPercent === null || work.totalProgress === null ? (
          <div className="library-card__open-progress">
            <strong>Progresso</strong>
            <span>{formatProgressValue(work)}</span>
            <span aria-hidden="true" className="library-card__open-track" />
          </div>
        ) : (
          <Progress
            ariaLabel={`Progresso de ${work.title}`}
            label="Progresso"
            max={work.totalProgress}
            value={work.currentProgress}
            valueLabel={formatProgressValue(work)}
          />
        )}

        <div className="library-card__details">
          <WorkProgressForm
            currentProgress={work.currentProgress}
            id={work.id}
            progressUnit={work.progressUnit}
            title={work.title}
            totalProgress={work.totalProgress}
          />

          <ProgressHistory
            {...(historyPreview ? { initialPage: historyPreview } : {})}
            progressUnit={work.progressUnit}
            timezone={timezone}
            title={work.title}
            workId={work.id}
          />
        </div>
      </div>
    </Card>
  );
}

export function LibraryView({
  historyPreview,
  initialQuery = "",
  initialStatus = "ALL",
  notice,
  result,
  timezone = "America/Sao_Paulo",
}: LibraryViewProps) {
  const works = useMemo(
    () => (result.status === "success" ? result.works : []),
    [result],
  );
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState("ALL");
  const [genre, setGenre] = useState("ALL");
  const [sort, setSort] = useState<LibrarySort>("UPDATED_DESC");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const genres = useMemo(
    () =>
      [...new Set(works.flatMap((work) => work.genres))].sort((first, second) =>
        first.localeCompare(second, "pt-BR"),
      ),
    [works],
  );
  const filteredWorks = useMemo(
    () =>
      filterAndSortLibraryWorks(works, {
        genre,
        query,
        sort,
        status: status as "ALL" | LibraryWork["status"],
        type: type as "ALL" | LibraryWork["type"],
      }),
    [genre, query, sort, status, type, works],
  );
  const activeFilterCount = [status, type, genre].filter(
    (value) => value !== "ALL",
  ).length;
  const hasActiveFilters =
    query !== "" || status !== "ALL" || type !== "ALL" || genre !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setStatus("ALL");
    setType("ALL");
    setGenre("ALL");
  };

  return (
    <div className="library">
      <PageHeader
        actions={
          <Link className="ui-button ui-button--primary" href="/library/new">
            Adicionar obra
          </Link>
        }
        description={
          result.status === "success"
            ? `${works.length} ${works.length === 1 ? "obra organizada" : "obras organizadas"} na sua estante.`
            : "Consulte e organize suas leituras em um só lugar."
        }
        eyebrow="Sua coleção"
        title="Biblioteca"
      />

      {notice === "work-created" || notice === "work-deleted" ? (
        <p className="library-notice" role="status">
          {notice === "work-created"
            ? "Obra adicionada à biblioteca com sucesso."
            : "Obra excluída da biblioteca."}
        </p>
      ) : null}

      {result.status === "error" ? (
        <section className="library-feedback">
          <ErrorState
            description="Verifique sua conexão e tente carregar as obras novamente."
            retryHref="/library"
            title="A biblioteca não pôde ser carregada"
          />
        </section>
      ) : works.length === 0 ? (
        <section className="library-feedback">
          <EmptyState
            action={
              <Link
                className="ui-button ui-button--primary ui-button--sm"
                href="/library/new"
              >
                Adicionar primeira obra
              </Link>
            }
            description="Comece com o livro que está na sua cabeceira ou com a próxima leitura da lista."
            title="Sua estante espera a primeira obra"
          />
        </section>
      ) : (
        <>
          <section
            aria-labelledby="library-filters-title"
            className="library-toolbar"
          >
            <div className="library-toolbar__heading">
              <div>
                <p>Encontre na estante</p>
                <h2 id="library-filters-title">Busca e organização</h2>
              </div>
              <output aria-live="polite">
                {filteredWorks.length}{" "}
                {filteredWorks.length === 1 ? "resultado" : "resultados"}
              </output>
            </div>

            <div className="library-toolbar__primary">
              <FormField htmlFor="library-query" label="Buscar">
                <Input
                  autoComplete="off"
                  id="library-query"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Título, autor, ISBN ou DOI"
                  type="search"
                  value={query}
                />
              </FormField>

              <FormField htmlFor="library-sort" label="Ordenar por">
                <Select
                  id="library-sort"
                  onChange={(event) =>
                    setSort(event.target.value as LibrarySort)
                  }
                  value={sort}
                >
                  <option value="UPDATED_DESC">Última atualização</option>
                  <option value="TITLE_ASC">Título de A a Z</option>
                  <option value="PROGRESS_DESC">Maior progresso</option>
                </Select>
              </FormField>

              <Button
                aria-controls="library-filter-options"
                aria-expanded={filtersOpen}
                className="library-filters-toggle"
                onClick={() => setFiltersOpen((isOpen) => !isOpen)}
                variant="secondary"
              >
                Filtros
                {activeFilterCount > 0 ? (
                  <span className="library-filters-toggle__count">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </div>

            <div
              className={[
                "library-filter-options",
                filtersOpen ? "library-filter-options--open" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              id="library-filter-options"
            >
              <FormField htmlFor="library-status" label="Status">
                <Select
                  id="library-status"
                  onChange={(event) =>
                    setStatus(
                      event.target.value as "ALL" | LibraryWork["status"],
                    )
                  }
                  value={status}
                >
                  <option value="ALL">Todos</option>
                  <option value="WANT_TO_READ">Quero ler</option>
                  <option value="READING">Lendo</option>
                  <option value="FINISHED">Finalizadas</option>
                  <option value="ABANDONED">Abandonadas</option>
                </Select>
              </FormField>

              <FormField htmlFor="library-type" label="Tipo">
                <Select
                  id="library-type"
                  onChange={(event) => setType(event.target.value)}
                  value={type}
                >
                  <option value="ALL">Todos</option>
                  <option value="BOOK">Livros</option>
                  <option value="MANGA">Mangás</option>
                  <option value="ARTICLE">Artigos</option>
                  <option value="EBOOK">E-books</option>
                </Select>
              </FormField>

              <FormField htmlFor="library-genre" label="Gênero">
                <Select
                  id="library-genre"
                  onChange={(event) => setGenre(event.target.value)}
                  value={genre}
                >
                  <option value="ALL">Todos os gêneros</option>
                  {genres.map((availableGenre) => (
                    <option key={availableGenre} value={availableGenre}>
                      {availableGenre}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {hasActiveFilters && filteredWorks.length > 0 ? (
              <div className="library-toolbar__actions">
                <Button onClick={clearFilters} size="sm" variant="ghost">
                  Limpar busca e filtros
                </Button>
              </div>
            ) : null}
          </section>

          {filteredWorks.length === 0 ? (
            <section className="library-feedback">
              <EmptyState
                action={
                  <Button onClick={clearFilters} size="sm" variant="secondary">
                    Limpar busca e filtros
                  </Button>
                }
                description="Tente remover algum filtro ou buscar com outros termos."
                title="Nenhuma obra encontrada"
              />
            </section>
          ) : (
            <section aria-labelledby="library-results-title">
              <h2 className="sr-only" id="library-results-title">
                Obras da biblioteca
              </h2>
              <ul className="library-grid">
                {filteredWorks.map((work) => (
                  <li key={work.id}>
                    <LibraryCard
                      historyPreview={historyPreview?.[work.id]}
                      timezone={timezone}
                      work={work}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
