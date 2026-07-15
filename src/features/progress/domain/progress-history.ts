import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

type ProgressEventType = Database["public"]["Enums"]["progress_event_type"];
type ProgressUnit = Database["public"]["Enums"]["progress_unit"];

export const PROGRESS_HISTORY_PAGE_SIZE = 5;

export type ProgressHistoryQuery = Readonly<{
  page: number;
  workId: string;
}>;

export type ProgressHistoryItem = Readonly<{
  eventType: ProgressEventType;
  id: string;
  newValue: number;
  previousValue: number;
  recordedAt: string;
}>;

export type ProgressHistoryPage = Readonly<{
  items: readonly ProgressHistoryItem[];
  nextPage: number | null;
  total: number;
}>;

const querySchema = z.object({
  page: z.coerce.number().int().min(0).max(1_000),
  workId: z.string().uuid(),
});

const historyItemSchema = z.object({
  eventType: z.enum(["UPDATE", "CORRECTION"]),
  id: z.string().uuid(),
  newValue: z.number().nonnegative(),
  previousValue: z.number().nonnegative(),
  recordedAt: z.string().datetime({ offset: true }),
});

const historyPageSchema = z.object({
  data: z.object({
    items: z.array(historyItemSchema),
    nextPage: z.number().int().nonnegative().nullable(),
    total: z.number().int().nonnegative(),
  }),
});

export function validateProgressHistoryQuery(searchParams: URLSearchParams) {
  const result = querySchema.safeParse({
    page: searchParams.get("page") ?? "0",
    workId: searchParams.get("workId") ?? "",
  });

  return result.success
    ? ({ data: result.data, ok: true } as const)
    : ({ ok: false } as const);
}

export function parseProgressHistoryResponse(
  value: unknown,
): ProgressHistoryPage | null {
  const result = historyPageSchema.safeParse(value);
  return result.success ? result.data.data : null;
}

export function formatProgressHistoryValue(value: number, unit: ProgressUnit) {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);

  if (unit === "PERCENT") {
    return `${formattedValue}%`;
  }

  if (unit === "CHAPTER") {
    return `${formattedValue} ${value === 1 ? "capítulo" : "capítulos"}`;
  }

  return `${formattedValue} ${value === 1 ? "página" : "páginas"}`;
}
