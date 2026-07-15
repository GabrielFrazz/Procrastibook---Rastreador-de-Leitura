import { z } from "zod";

import {
  normalizeCatalogList,
  normalizeCatalogText,
  normalizeIsbn,
  normalizePageCount,
  normalizePublishedYear,
} from "@/features/catalog/domain/catalog-normalization";
import {
  CatalogProviderError,
  type CatalogProvider,
  type CatalogQuery,
  type NormalizedWorkCandidate,
} from "@/features/catalog/domain/catalog-provider";

type Fetcher = typeof fetch;

type OpenLibraryProviderOptions = Readonly<{
  fetcher?: Fetcher;
  timeoutMs?: number;
  userAgent: string;
}>;

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_FIELDS = [
  "key",
  "title",
  "subtitle",
  "author_name",
  "first_publish_year",
  "isbn",
  "language",
  "publisher",
  "number_of_pages_median",
  "cover_i",
  "subject",
].join(",");
const DEFAULT_TIMEOUT_MS = 4_000;

const openLibraryEnvelopeSchema = z.object({
  docs: z.array(z.unknown()).optional(),
});

const openLibraryWorkSchema = z.object({
  author_name: z.array(z.string()).optional(),
  cover_i: z.number().optional(),
  first_publish_year: z.number().optional(),
  isbn: z.array(z.string()).optional(),
  key: z.string().trim().min(1),
  language: z.array(z.string()).optional(),
  number_of_pages_median: z.number().optional(),
  publisher: z.array(z.string()).optional(),
  subject: z.array(z.string()).optional(),
  subtitle: z.string().optional(),
  title: z.string(),
});

type OpenLibraryWork = z.infer<typeof openLibraryWorkSchema>;

function canonicalWorkKey(value: string) {
  const normalized = value.trim();
  const identifier = normalized.startsWith("/works/")
    ? normalized.slice("/works/".length)
    : normalized;

  return /^OL\d+W$/i.test(identifier)
    ? `/works/${identifier.toUpperCase()}`
    : null;
}

function firstIsbn(
  values: readonly string[] | undefined,
  type: "ISBN_10" | "ISBN_13",
) {
  for (const value of values ?? []) {
    const isbn = normalizeIsbn(value, type);

    if (isbn) {
      return isbn;
    }
  }

  return null;
}

function normalizeWork(work: OpenLibraryWork): NormalizedWorkCandidate | null {
  const externalId = canonicalWorkKey(work.key);
  const title = normalizeCatalogText(work.title, 200);

  if (!externalId || !title) {
    return null;
  }

  const coverId = work.cover_i;
  const coverUrl =
    coverId && Number.isInteger(coverId) && coverId > 0
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`
      : null;

  return {
    authors: normalizeCatalogList(work.author_name, 8, 120),
    coverUrl,
    description: null,
    externalId,
    genres: normalizeCatalogList(work.subject, 10, 60),
    infoUrl: `https://openlibrary.org${externalId}`,
    isbn10: firstIsbn(work.isbn, "ISBN_10"),
    isbn13: firstIsbn(work.isbn, "ISBN_13"),
    language: normalizeCatalogText(work.language?.[0], 35),
    pageCount: normalizePageCount(work.number_of_pages_median),
    provider: "OPEN_LIBRARY",
    publishedYear: normalizePublishedYear(work.first_publish_year),
    publisher: normalizeCatalogText(work.publisher?.[0], 160),
    subtitle: normalizeCatalogText(work.subtitle, 200),
    suggestedType: "BOOK",
    title,
  };
}

function buildSearchTerm(query: string) {
  const isbn = query.replace(/[\s-]/g, "").toUpperCase();

  return /^\d{13}$|^\d{9}[\dX]$/.test(isbn) ? `isbn:${isbn}` : query;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export class OpenLibraryProvider implements CatalogProvider {
  readonly provider = "OPEN_LIBRARY" as const;
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(options: OpenLibraryProviderOptions) {
    const userAgent = options.userAgent.trim();

    if (!userAgent) {
      throw new Error("Open Library requires a non-empty User-Agent.");
    }

    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.userAgent = userAgent;
  }

  async search(
    query: CatalogQuery,
  ): Promise<readonly NormalizedWorkCandidate[]> {
    const url = this.createSearchUrl();
    url.searchParams.set("limit", String(query.limit));
    url.searchParams.set("q", buildSearchTerm(query.query));

    if (query.language) {
      url.searchParams.set("lang", query.language);
    }

    return this.requestWorks(url);
  }

  async getById(externalId: string): Promise<NormalizedWorkCandidate | null> {
    const key = canonicalWorkKey(externalId);

    if (!key) {
      return null;
    }

    const url = this.createSearchUrl();
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", `key:${key}`);
    const works = await this.requestWorks(url);

    return works.find((work) => work.externalId === key) ?? null;
  }

  private createSearchUrl() {
    const url = new URL(OPEN_LIBRARY_SEARCH_URL);
    url.searchParams.set("fields", OPEN_LIBRARY_FIELDS);
    return url;
  }

  private async requestWorks(url: URL) {
    const payload = await this.requestJson(url);
    const envelope = openLibraryEnvelopeSchema.safeParse(payload);

    if (!envelope.success) {
      throw new CatalogProviderError("INVALID_RESPONSE");
    }

    return (envelope.data.docs ?? []).flatMap((document) => {
      const parsed = openLibraryWorkSchema.safeParse(document);

      if (!parsed.success) {
        return [];
      }

      const normalized = normalizeWork(parsed.data);
      return normalized ? [normalized] : [];
    });
  }

  private async requestJson(url: URL) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetcher(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": this.userAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new CatalogProviderError("UNAVAILABLE", {
          status: response.status,
        });
      }

      try {
        return await response.json();
      } catch (error) {
        throw new CatalogProviderError("INVALID_RESPONSE", { cause: error });
      }
    } catch (error) {
      if (error instanceof CatalogProviderError) {
        throw error;
      }

      if (controller.signal.aborted || isAbortError(error)) {
        throw new CatalogProviderError("TIMEOUT", { cause: error });
      }

      throw new CatalogProviderError("UNAVAILABLE", { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}
