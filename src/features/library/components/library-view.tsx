"use client";

import { useMemo, useState, type CSSProperties, type SVGProps } from "react";

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
import {
  filterAndSortLibraryWorks,
  type LibrarySort,
  type LibraryWork,
} from "@/features/library/domain/library-catalog";

export type LibraryResult =
  | Readonly<{ status: "error" }>
  | Readonly<{ status: "success"; works: readonly LibraryWork[] }>;

type LibraryViewProps = Readonly<{
  result: LibraryResult;
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

function LibraryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h4v16H7a2.5 2.5 0 0 0-2.5 2.5v-16Zm15 0A2.5 2.5 0 0 0 17 3h-4v16h4a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </svg>
  );
}

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

  return work.totalProgress === null
    ? current
    : `${numberFormatter.format(work.currentProgress)} de ${numberFormatter.format(work.totalProgress)}`;
}

function getCoverStyle(coverUrl: string | null): CSSProperties | undefined {
  return coverUrl
    ? { backgroundImage: `url(${JSON.stringify(coverUrl)})` }
    : undefined;
}

function LibraryCard({ work }: Readonly<{ work: LibraryWork }>) {
  return (
    <Card as="article" className="library-card" padded={false}>
      <div
        aria-hidden="true"
        className={[
          "library-card__cover",
          work.coverUrl ? "library-card__cover--image" : null,
        ]
          .filter(Boolean)
          .join(" ")}
        style={getCoverStyle(work.coverUrl)}
      >
        {work.coverUrl ? null : (
          <span className="library-card__placeholder">
            <LibraryIcon />
            <span>{typeLabels[work.type]}</span>
          </span>
        )}
      </div>

      <div className="library-card__content">
        <div className="library-card__metadata">
          <div className="library-card__badges">
            <Badge>{typeLabels[work.type]}</Badge>
            {work.genres[0] ? <span>{work.genres[0]}</span> : null}
          </div>
          <h2>{work.title}</h2>
          <p className="library-card__authors">
            {work.authors.length > 0
              ? work.authors.join(", ")
              : "Autoria não informada"}
          </p>
        </div>

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
    </Card>
  );
}

export function LibraryView({ result }: LibraryViewProps) {
  const works = useMemo(
    () => (result.status === "success" ? result.works : []),
    [result],
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [genre, setGenre] = useState("ALL");
  const [sort, setSort] = useState<LibrarySort>("UPDATED_DESC");
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
        description={
          result.status === "success"
            ? `${works.length} ${works.length === 1 ? "obra organizada" : "obras organizadas"} na sua estante.`
            : "Consulte e organize suas leituras em um só lugar."
        }
        eyebrow="Sua coleção"
        title="Biblioteca"
      />

      {result.status === "error" ? (
        <Card as="section">
          <ErrorState
            description="Verifique sua conexão e tente carregar as obras novamente."
            retryHref="/library"
            title="A biblioteca não pôde ser carregada"
          />
        </Card>
      ) : works.length === 0 ? (
        <Card as="section">
          <EmptyState
            description="Quando você adicionar sua primeira obra, ela aparecerá aqui com status e progresso."
            title="Sua biblioteca está vazia"
          />
        </Card>
      ) : (
        <>
          <Card
            aria-labelledby="library-filters-title"
            as="section"
            className="library-filters"
          >
            <div className="library-filters__heading">
              <div>
                <p>Refine sua estante</p>
                <h2 id="library-filters-title">Busca e filtros</h2>
              </div>
              <output aria-live="polite">
                {filteredWorks.length}{" "}
                {filteredWorks.length === 1 ? "resultado" : "resultados"}
              </output>
            </div>

            <div className="library-filters__grid">
              <FormField htmlFor="library-query" label="Buscar">
                <Input
                  autoComplete="off"
                  id="library-query"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Título, subtítulo ou autor"
                  type="search"
                  value={query}
                />
              </FormField>

              <FormField htmlFor="library-status" label="Status">
                <Select
                  id="library-status"
                  onChange={(event) => setStatus(event.target.value)}
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
            </div>

            {hasActiveFilters ? (
              <div className="library-filters__actions">
                <Button onClick={clearFilters} size="sm" variant="ghost">
                  Limpar filtros
                </Button>
              </div>
            ) : null}
          </Card>

          {filteredWorks.length === 0 ? (
            <Card as="section">
              <EmptyState
                description="Tente remover algum filtro ou buscar com outros termos."
                title="Nenhuma obra encontrada"
              />
              <div className="library-empty-action">
                <Button onClick={clearFilters} size="sm" variant="secondary">
                  Limpar filtros
                </Button>
              </div>
            </Card>
          ) : (
            <section aria-labelledby="library-results-title">
              <h2 className="sr-only" id="library-results-title">
                Obras da biblioteca
              </h2>
              <ul className="library-grid">
                {filteredWorks.map((work) => (
                  <li key={work.id}>
                    <LibraryCard work={work} />
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
