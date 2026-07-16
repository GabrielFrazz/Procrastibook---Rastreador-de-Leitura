"use client";

import { useState, type FormEvent, type SVGProps } from "react";

import {
  Badge,
  BookCover,
  Button,
  Card,
  FormField,
  Input,
  Skeleton,
} from "@/components/ui";
import { parseCatalogSearchResponse } from "@/features/catalog/domain/catalog-search-response";
import type { NormalizedWorkCandidate } from "@/features/catalog/domain/catalog-provider";

type CatalogSearchPanelProps = Readonly<{
  initialCandidates?: readonly NormalizedWorkCandidate[];
  onSelect: (candidate: NormalizedWorkCandidate) => void;
  searchEndpoint?: string;
}>;

type SearchStatus = "error" | "idle" | "loading" | "success";

const providerLabels = {
  GOOGLE_BOOKS: "Google Books",
  OPEN_LIBRARY: "Open Library",
} as const;

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m20 20-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
    </svg>
  );
}

function resultDetails(candidate: NormalizedWorkCandidate) {
  return [
    candidate.publishedYear,
    candidate.pageCount ? `${candidate.pageCount} páginas` : null,
    candidate.isbn13 ? `ISBN ${candidate.isbn13}` : null,
  ]
    .filter((value): value is number | string => value !== null)
    .join(" · ");
}

function CatalogSearchSkeleton() {
  return (
    <div aria-hidden="true" className="catalog-search__skeleton">
      {["first", "second"].map((item) => (
        <div className="catalog-search__skeleton-row" key={item}>
          <Skeleton variant="cover" width="3.75rem" />
          <div>
            <Skeleton variant="text" width="5rem" />
            <Skeleton variant="text" width="min(18rem, 75%)" />
            <Skeleton variant="text" width="min(12rem, 58%)" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogSearchPanel({
  initialCandidates = [],
  onSelect,
  searchEndpoint = "/api/catalog/search",
}: CatalogSearchPanelProps) {
  const [candidates, setCandidates] =
    useState<readonly NormalizedWorkCandidate[]>(initialCandidates);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [status, setStatus] = useState<SearchStatus>(
    initialCandidates.length > 0 ? "success" : "idle",
  );

  const search = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setErrorMessage("Digite pelo menos dois caracteres para buscar.");
      setStatus("error");
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>("#catalog-query")?.focus();
      });
      return;
    }

    setErrorMessage(null);
    setStatus("loading");

    try {
      const parameters = new URLSearchParams({
        language: "pt",
        limit: "10",
        q: normalizedQuery,
      });
      const response = await fetch(`${searchEndpoint}?${parameters}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const message =
          response.status === 401
            ? "Sua sessão expirou. Entre novamente antes de buscar."
            : response.status === 429
              ? "Muitas buscas em pouco tempo. Aguarde e tente novamente."
              : "Não foi possível consultar os catálogos agora.";
        setErrorMessage(message);
        setStatus("error");
        return;
      }

      const parsed = parseCatalogSearchResponse(await response.json());

      if (!parsed) {
        setErrorMessage("Os catálogos retornaram dados inesperados.");
        setStatus("error");
        return;
      }

      setCandidates(parsed);
      setSelectedKey(null);
      setStatus("success");
    } catch {
      setErrorMessage("A busca está indisponível. Verifique sua conexão.");
      setStatus("error");
    }
  };

  return (
    <Card
      aria-labelledby="catalog-search-title"
      as="section"
      className="catalog-search"
    >
      <div className="catalog-search__heading">
        <span aria-hidden="true" className="catalog-search__icon">
          <SearchIcon />
        </span>
        <div>
          <p>Importação automática</p>
          <h2 id="catalog-search-title">Buscar nos catálogos</h2>
        </div>
      </div>

      <form className="catalog-search__form" onSubmit={search} role="search">
        <FormField
          hint="Busque por título, autoria ou ISBN."
          htmlFor="catalog-query"
          label="Obra"
        >
          <div className="catalog-search__input-row">
            <Input
              aria-controls="catalog-results"
              aria-describedby={
                status === "error"
                  ? "catalog-query-hint catalog-search-error"
                  : "catalog-query-hint"
              }
              aria-invalid={
                status === "error" && query.trim().length < 2 ? true : undefined
              }
              autoComplete="off"
              id="catalog-query"
              maxLength={120}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: Dom Casmurro ou 9788535902775"
              type="search"
              value={query}
            />
            <Button isLoading={status === "loading"} type="submit">
              {status === "loading" ? "Buscando…" : "Buscar obra"}
            </Button>
          </div>
        </FormField>
      </form>

      <div
        aria-busy={status === "loading"}
        aria-live="polite"
        id="catalog-results"
      >
        {status === "idle" ? (
          <p className="catalog-search__notice">
            Você também pode preencher o formulário manualmente logo abaixo.
          </p>
        ) : status === "loading" ? (
          <div className="catalog-search__loading" role="status">
            <p className="catalog-search__notice">
              Consultando Google Books e Open Library…
            </p>
            <CatalogSearchSkeleton />
          </div>
        ) : status === "error" ? (
          <div className="catalog-search__feedback" role="alert">
            <p id="catalog-search-error">{errorMessage}</p>
            {query.trim().length >= 2 ? (
              <Button
                onClick={() => void search()}
                size="sm"
                variant="secondary"
              >
                Tentar novamente
              </Button>
            ) : null}
          </div>
        ) : candidates.length === 0 ? (
          <div className="catalog-search__feedback">
            <strong>Nenhuma obra encontrada</strong>
            <p>Tente outro título ou continue com o cadastro manual.</p>
          </div>
        ) : (
          <>
            <div className="catalog-search__summary">
              <strong>
                {candidates.length}{" "}
                {candidates.length === 1 ? "resultado" : "resultados"}
              </strong>
              <span>Selecione uma obra para preencher o formulário.</span>
            </div>
            <ul className="catalog-results">
              {candidates.map((candidate) => {
                const key = `${candidate.provider}:${candidate.externalId}`;
                const selected = selectedKey === key;

                return (
                  <li key={key}>
                    <article className="catalog-result">
                      <BookCover
                        alt=""
                        className="catalog-result__cover"
                        size="sm"
                        src={candidate.coverUrl}
                        title={candidate.title}
                      />
                      <div className="catalog-result__content">
                        <Badge>{providerLabels[candidate.provider]}</Badge>
                        <h3>{candidate.title}</h3>
                        <p>
                          {candidate.authors.length > 0
                            ? candidate.authors.join(", ")
                            : "Autoria não informada"}
                        </p>
                        {resultDetails(candidate) ? (
                          <small>{resultDetails(candidate)}</small>
                        ) : null}
                      </div>
                      <Button
                        aria-pressed={selected}
                        disabled={selected}
                        onClick={() => {
                          setSelectedKey(key);
                          onSelect(candidate);
                        }}
                        size="sm"
                        variant={selected ? "primary" : "secondary"}
                      >
                        {selected ? "Selecionada" : "Usar estes dados"}
                      </Button>
                    </article>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
