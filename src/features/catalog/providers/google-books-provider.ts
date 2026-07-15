import { z } from "zod";

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

const entityMap: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntity(entity: string) {
  const normalized = entity.toLowerCase();

  const decodeCodePoint = (value: string, radix: number) => {
    const codePoint = Number.parseInt(value, radix);

    if (
      !Number.isInteger(codePoint) ||
      codePoint < 0 ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      return " ";
    }

    return String.fromCodePoint(codePoint);
  };

  if (normalized.startsWith("#x")) {
    return decodeCodePoint(normalized.slice(2), 16);
  }

  if (normalized.startsWith("#")) {
    return decodeCodePoint(normalized.slice(1), 10);
  }

  return entityMap[normalized] ?? " ";
}

function normalizeText(value: string | undefined, maximumLength: number) {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z]+|#\d+|#x[\da-f]+);/gi, (_match, entity: string) =>
      decodeEntity(entity),
    )
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized ? normalized.slice(0, maximumLength) : null;
}

function normalizeList(
  values: readonly string[] | undefined,
  maximumItems: number,
  maximumLength: number,
) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values ?? []) {
    const item = normalizeText(value, maximumLength);
    const key = item?.toLocaleLowerCase("pt-BR");

    if (!item || !key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(item);

    if (normalized.length === maximumItems) {
      break;
    }
  }

  return normalized;
}

function normalizeUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizePublishedYear(value: string | undefined) {
  const match = value?.match(/(?:^|\D)(\d{4})(?:\D|$)/);
  const year = match?.[1] ? Number(match[1]) : Number.NaN;

  return Number.isInteger(year) && year >= 1000 && year <= 2100 ? year : null;
}

function findIdentifier(
  identifiers: GoogleBooksVolume["volumeInfo"]["industryIdentifiers"],
  type: "ISBN_10" | "ISBN_13",
) {
  const rawValue = identifiers?.find((item) => item.type === type)?.identifier;
  const value = rawValue?.replace(/[\s-]/g, "").toUpperCase();

  if (type === "ISBN_10") {
    return value && /^\d{9}[\dX]$/.test(value) ? value : null;
  }

  return value && /^\d{13}$/.test(value) ? value : null;
}

function pickCoverUrl(
  imageLinks: GoogleBooksVolume["volumeInfo"]["imageLinks"],
) {
  return normalizeUrl(
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
  const title = normalizeText(volume.volumeInfo.title, 200);

  if (!title) {
    return null;
  }

  const pageCount = volume.volumeInfo.pageCount;

  return {
    authors: normalizeList(volume.volumeInfo.authors, 8, 120),
    coverUrl: pickCoverUrl(volume.volumeInfo.imageLinks),
    description: normalizeText(volume.volumeInfo.description, 5_000),
    externalId: volume.id,
    genres: normalizeList(volume.volumeInfo.categories, 10, 60),
    infoUrl: normalizeUrl(volume.volumeInfo.infoLink),
    isbn10: findIdentifier(volume.volumeInfo.industryIdentifiers, "ISBN_10"),
    isbn13: findIdentifier(volume.volumeInfo.industryIdentifiers, "ISBN_13"),
    language: normalizeText(volume.volumeInfo.language, 35),
    pageCount:
      pageCount &&
      Number.isInteger(pageCount) &&
      pageCount > 0 &&
      pageCount <= 10_000_000
        ? pageCount
        : null,
    provider: "GOOGLE_BOOKS",
    publishedYear: normalizePublishedYear(volume.volumeInfo.publishedDate),
    publisher: normalizeText(volume.volumeInfo.publisher, 160),
    subtitle: normalizeText(volume.volumeInfo.subtitle, 200),
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
