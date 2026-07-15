import { z } from "zod";

import {
  normalizeCatalogList,
  normalizeCatalogText,
  normalizeCatalogUrl,
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

type GoogleBooksProviderOptions = Readonly<{
  apiKey?: string;
  fetcher?: Fetcher;
  timeoutMs?: number;
}>;

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";
const DEFAULT_TIMEOUT_MS = 4_000;

const googleBooksEnvelopeSchema = z.object({
  items: z.array(z.unknown()).optional(),
});

const googleBooksVolumeSchema = z.object({
  id: z.string().trim().min(1),
  saleInfo: z
    .object({
      isEbook: z.boolean().optional(),
    })
    .optional(),
  volumeInfo: z.object({
    authors: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    description: z.string().optional(),
    imageLinks: z
      .object({
        extraLarge: z.string().optional(),
        large: z.string().optional(),
        medium: z.string().optional(),
        small: z.string().optional(),
        smallThumbnail: z.string().optional(),
        thumbnail: z.string().optional(),
      })
      .optional(),
    industryIdentifiers: z
      .array(
        z.object({
          identifier: z.string(),
          type: z.string(),
        }),
      )
      .optional(),
    infoLink: z.string().optional(),
    language: z.string().optional(),
    pageCount: z.number().optional(),
    publishedDate: z.string().optional(),
    publisher: z.string().optional(),
    subtitle: z.string().optional(),
    title: z.string(),
  }),
});

type GoogleBooksVolume = z.infer<typeof googleBooksVolumeSchema>;

function findIdentifier(
  identifiers: GoogleBooksVolume["volumeInfo"]["industryIdentifiers"],
  type: "ISBN_10" | "ISBN_13",
) {
  const value = identifiers?.find((item) => item.type === type)?.identifier;

  return normalizeIsbn(value, type);
}

function pickCoverUrl(
  imageLinks: GoogleBooksVolume["volumeInfo"]["imageLinks"],
) {
  return normalizeCatalogUrl(
    imageLinks?.extraLarge ??
      imageLinks?.large ??
      imageLinks?.medium ??
      imageLinks?.small ??
      imageLinks?.thumbnail ??
      imageLinks?.smallThumbnail,
  );
}

function normalizeVolume(
  volume: GoogleBooksVolume,
): NormalizedWorkCandidate | null {
  const title = normalizeCatalogText(volume.volumeInfo.title, 200);

  if (!title) {
    return null;
  }

  return {
    authors: normalizeCatalogList(volume.volumeInfo.authors, 8, 120),
    coverUrl: pickCoverUrl(volume.volumeInfo.imageLinks),
    description: normalizeCatalogText(volume.volumeInfo.description, 5_000),
    externalId: volume.id,
    genres: normalizeCatalogList(volume.volumeInfo.categories, 10, 60),
    infoUrl: normalizeCatalogUrl(volume.volumeInfo.infoLink),
    isbn10: findIdentifier(volume.volumeInfo.industryIdentifiers, "ISBN_10"),
    isbn13: findIdentifier(volume.volumeInfo.industryIdentifiers, "ISBN_13"),
    language: normalizeCatalogText(volume.volumeInfo.language, 35),
    pageCount: normalizePageCount(volume.volumeInfo.pageCount),
    provider: "GOOGLE_BOOKS",
    publishedYear: normalizePublishedYear(volume.volumeInfo.publishedDate),
    publisher: normalizeCatalogText(volume.volumeInfo.publisher, 160),
    subtitle: normalizeCatalogText(volume.volumeInfo.subtitle, 200),
    suggestedType: volume.saleInfo?.isEbook ? "EBOOK" : "BOOK",
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

export class GoogleBooksProvider implements CatalogProvider {
  readonly provider = "GOOGLE_BOOKS" as const;
  private readonly apiKey: string | undefined;
  private readonly fetcher: Fetcher;
  private readonly timeoutMs: number;

  constructor(options: GoogleBooksProviderOptions = {}) {
    this.apiKey = options.apiKey?.trim() || undefined;
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async search(
    query: CatalogQuery,
  ): Promise<readonly NormalizedWorkCandidate[]> {
    const url = new URL(GOOGLE_BOOKS_URL);
    url.searchParams.set("maxResults", String(query.limit));
    url.searchParams.set("printType", "books");
    url.searchParams.set("projection", "full");
    url.searchParams.set("q", buildSearchTerm(query.query));

    if (query.language) {
      url.searchParams.set("langRestrict", query.language);
    }

    this.addApiKey(url);
    const payload = await this.requestJson(url);
    const envelope = googleBooksEnvelopeSchema.safeParse(payload);

    if (!envelope.success) {
      throw new CatalogProviderError("INVALID_RESPONSE");
    }

    return (envelope.data.items ?? []).flatMap((item) => {
      const parsed = googleBooksVolumeSchema.safeParse(item);

      if (!parsed.success) {
        return [];
      }

      const normalized = normalizeVolume(parsed.data);
      return normalized ? [normalized] : [];
    });
  }

  async getById(externalId: string): Promise<NormalizedWorkCandidate | null> {
    const normalizedId = externalId.trim();

    if (!normalizedId || normalizedId.length > 128) {
      return null;
    }

    const url = new URL(
      `${GOOGLE_BOOKS_URL}/${encodeURIComponent(normalizedId)}`,
    );
    this.addApiKey(url);
    const payload = await this.requestJson(url, true);

    if (payload === null) {
      return null;
    }

    const parsed = googleBooksVolumeSchema.safeParse(payload);

    if (!parsed.success) {
      throw new CatalogProviderError("INVALID_RESPONSE");
    }

    return normalizeVolume(parsed.data);
  }

  private addApiKey(url: URL) {
    if (this.apiKey) {
      url.searchParams.set("key", this.apiKey);
    }
  }

  private async requestJson(url: URL, allowNotFound = false) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetcher(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (allowNotFound && response.status === 404) {
        return null;
      }

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
