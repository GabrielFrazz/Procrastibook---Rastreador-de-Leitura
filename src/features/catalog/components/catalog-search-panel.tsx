"use client";

import {
  useState,
  type CSSProperties,
  type FormEvent,
  type SVGProps,
} from "react";

import { Badge, Button, Card, FormField, Input } from "@/components/ui";
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

function BookIcon(props: SVGProps<SVGSVGElement>) {
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

function coverStyle(url: string | null): CSSProperties | undefined {
  return url ? { backgroundImage: `url(${JSON.stringify(url)})` } : undefined;
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
          <Input
            aria-controls="catalog-results"
            autoComplete="off"
            id="catalog-query"
            maxLength={120}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: Dom Casmurro ou 9788535902775"
            type="search"
            value={query}
          />
        </FormField>
        <Button isLoading={status === "loading"} type="submit">
          {status === "loading" ? "Buscando…" : "Buscar obra"}
        </Button>
      </form>

      <div aria-live="polite" id="catalog-results">
        {status === "idle" ? (
          <p className="catalog-search__notice">
            Você também pode preencher o formulário manualmente logo abaixo.
          </p>
        ) : status === "loading" ? (
          <p className="catalog-search__notice" role="status">
            Consultando Google Books e Open Library…
          </p>
        ) : status === "error" ? (
          <div className="catalog-search__feedback" role="alert">
            <p>{errorMessage}</p>
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
                      <div
                        aria-hidden="true"
                        className={[
                          "catalog-result__cover",
                          candidate.coverUrl
                            ? "catalog-result__cover--image"
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={coverStyle(candidate.coverUrl)}
                      >
                        {candidate.coverUrl ? null : <BookIcon />}
                      </div>
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
