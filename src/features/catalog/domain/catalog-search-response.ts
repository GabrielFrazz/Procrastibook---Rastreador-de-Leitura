import { z } from "zod";

import type { NormalizedWorkCandidate } from "@/features/catalog/domain/catalog-provider";

const normalizedWorkCandidateSchema = z.object({
  authors: z.array(z.string()),
  coverUrl: z.string().url().nullable(),
  description: z.string().nullable(),
  externalId: z.string().min(1),
  genres: z.array(z.string()),
  infoUrl: z.string().url().nullable(),
  isbn10: z.string().nullable(),
  isbn13: z.string().nullable(),
  language: z.string().nullable(),
  pageCount: z.number().int().positive().nullable(),
  provider: z.enum(["GOOGLE_BOOKS", "OPEN_LIBRARY"]),
  publishedYear: z.number().int().nullable(),
  publisher: z.string().nullable(),
  subtitle: z.string().nullable(),
  suggestedType: z.enum(["BOOK", "EBOOK"]),
  title: z.string().min(1),
});

const catalogSearchResponseSchema = z.object({
  data: z.array(normalizedWorkCandidateSchema),
});

export function parseCatalogSearchResponse(
  value: unknown,
): readonly NormalizedWorkCandidate[] | null {
  const result = catalogSearchResponseSchema.safeParse(value);
  return result.success ? result.data.data : null;
}
