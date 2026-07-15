import { z } from "zod";

export type ExternalProvider = "GOOGLE_BOOKS" | "OPEN_LIBRARY";
export type CatalogSuggestedType = "BOOK" | "EBOOK";

export type NormalizedWorkCandidate = Readonly<{
  authors: readonly string[];
  coverUrl: string | null;
  description: string | null;
  externalId: string;
  genres: readonly string[];
  infoUrl: string | null;
  isbn10: string | null;
  isbn13: string | null;
  language: string | null;
  pageCount: number | null;
  provider: ExternalProvider;
  publishedYear: number | null;
  publisher: string | null;
  subtitle: string | null;
  suggestedType: CatalogSuggestedType;
  title: string;
}>;

export type CatalogQuery = Readonly<{
  language: string | null;
  limit: number;
  query: string;
}>;

export type CatalogQueryField = "language" | "limit" | "query";

export type CatalogQueryValidationResult =
  | Readonly<{ data: CatalogQuery; ok: true }>
  | Readonly<{
      fieldErrors: Partial<Record<CatalogQueryField, readonly string[]>>;
      ok: false;
    }>;

export type CatalogProviderErrorCode =
  "INVALID_RESPONSE" | "TIMEOUT" | "UNAVAILABLE";

export class CatalogProviderError extends Error {
  readonly code: CatalogProviderErrorCode;
  readonly status: number | null;

  constructor(
    code: CatalogProviderErrorCode,
    options: Readonly<{ cause?: unknown; status?: number }> = {},
  ) {
    const messages: Record<CatalogProviderErrorCode, string> = {
      INVALID_RESPONSE: "O catálogo retornou uma resposta inválida.",
      TIMEOUT: "O catálogo demorou demais para responder.",
      UNAVAILABLE: "O catálogo está temporariamente indisponível.",
    };

    super(messages[code], { cause: options.cause });
    this.name = "CatalogProviderError";
    this.code = code;
    this.status = options.status ?? null;
  }
}

export interface CatalogProvider {
  readonly provider: ExternalProvider;
  getById(externalId: string): Promise<NormalizedWorkCandidate | null>;
  search(query: CatalogQuery): Promise<readonly NormalizedWorkCandidate[]>;
}

const catalogQuerySchema = z.object({
  language: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z]{2}$/, "Use um código de idioma com duas letras.")
      .optional(),
  ),
  limit: z.coerce
    .number()
    .int("O limite deve ser inteiro.")
    .min(1, "Solicite pelo menos um resultado.")
    .max(20, "Solicite no máximo vinte resultados.")
    .default(10),
  query: z
    .string()
    .trim()
    .min(2, "Digite pelo menos dois caracteres.")
    .max(120, "Use no máximo 120 caracteres."),
});

export function validateCatalogQuery(
  input: unknown,
): CatalogQueryValidationResult {
  const result = catalogQuerySchema.safeParse(input);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;

    return {
      fieldErrors: {
        ...(errors.language ? { language: errors.language } : {}),
        ...(errors.limit ? { limit: errors.limit } : {}),
        ...(errors.query ? { query: errors.query } : {}),
      },
      ok: false,
    };
  }

  return {
    data: {
      language: result.data.language ?? null,
      limit: result.data.limit,
      query: result.data.query,
    },
    ok: true,
  };
}
