import type { Database } from "@/lib/supabase/database.types";

type ProgressUnit = Database["public"]["Enums"]["progress_unit"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type WorkType = Database["public"]["Enums"]["work_type"];

export type WorkManagementState = Readonly<{
  fieldErrors: Partial<Record<string, readonly string[]>>;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

export const INITIAL_WORK_MANAGEMENT_STATE: WorkManagementState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

export type UpdateOwnedWorkInput = Readonly<{
  authors: readonly string[];
  chapterCount?: number;
  description?: string;
  doi?: string;
  genres: readonly string[];
  isbn10?: string;
  isbn13?: string;
  language?: string;
  pageCount?: number;
  progressUnit: ProgressUnit;
  publishedYear?: number;
  publisher?: string;
  status: ReadingStatus;
  subtitle?: string;
  title: string;
  type: WorkType;
  workId: string;
}>;

const workTypes: readonly WorkType[] = ["BOOK", "MANGA", "ARTICLE", "EBOOK"];
const statuses: readonly ReadingStatus[] = [
  "WANT_TO_READ",
  "READING",
  "FINISHED",
  "ABANDONED",
];
const progressUnits: readonly ProgressUnit[] = ["PAGE", "CHAPTER", "PERCENT"];

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = value.toLocaleLowerCase("pt-BR");

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function splitValues(value: string, separator: RegExp) {
  return uniqueValues(
    value
      .split(separator)
      .map((item) => item.trim().replace(/\s+/g, " "))
      .filter(Boolean),
  );
}

function addError(
  errors: Record<string, string[]>,
  field: string,
  message: string,
) {
  errors[field] = [...(errors[field] ?? []), message];
}

function optionalText(
  formData: FormData,
  field: string,
  maximumLength: number,
  errors: Record<string, string[]>,
) {
  const value = readText(formData, field);

  if (value.length > maximumLength) {
    addError(errors, field, `Use no máximo ${maximumLength} caracteres.`);
  }

  return value || undefined;
}

export function validateUpdateWorkForm(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const workId = readText(formData, "workId");
  const title = readText(formData, "title");
  const authors = splitValues(readText(formData, "authors"), /;/);
  const genres = splitValues(readText(formData, "genres"), /[,;]/);
  const typeValue = readText(formData, "type");
  const statusValue = readText(formData, "status");
  const progressUnitValue = readText(formData, "progressUnit");
  const totalValue = readText(formData, "total");
  const yearValue = readText(formData, "publishedYear");
  const isbn10 = readText(formData, "isbn10")
    .replace(/[\s-]/g, "")
    .toUpperCase();
  const isbn13 = readText(formData, "isbn13").replace(/[\s-]/g, "");
  const doi = optionalText(formData, "doi", 250, errors);

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      workId,
    )
  ) {
    addError(errors, "workId", "A obra informada é inválida.");
  }

  if (title.length < 1 || title.length > 200) {
    addError(errors, "title", "Informe um título com até 200 caracteres.");
  }

  if (authors.length === 0 || authors.length > 8) {
    addError(errors, "authors", "Informe entre um e oito autores.");
  } else if (authors.some((author) => author.length > 120)) {
    addError(errors, "authors", "Cada nome deve ter no máximo 120 caracteres.");
  }

  if (genres.length > 10 || genres.some((genre) => genre.length > 60)) {
    addError(
      errors,
      "genres",
      "Informe até dez gêneros com no máximo 60 caracteres.",
    );
  }

  if (!workTypes.includes(typeValue as WorkType)) {
    addError(errors, "type", "Selecione um tipo válido.");
  }

  if (!statuses.includes(statusValue as ReadingStatus)) {
    addError(errors, "status", "Selecione um status válido.");
  }

  if (!progressUnits.includes(progressUnitValue as ProgressUnit)) {
    addError(errors, "progressUnit", "A unidade de progresso é inválida.");
  }

  if (progressUnitValue === "CHAPTER" && typeValue !== "MANGA") {
    addError(errors, "type", "Obras por capítulo devem permanecer como mangá.");
  }

  let total: number | undefined;
  if (progressUnitValue !== "PERCENT" && totalValue !== "") {
    total = Number(totalValue);
    if (!Number.isInteger(total) || total < 1 || total > 10_000_000) {
      addError(errors, "total", "Informe um total inteiro maior que zero.");
    }
  }

  let publishedYear: number | undefined;
  if (yearValue !== "") {
    publishedYear = Number(yearValue);
    if (
      !Number.isInteger(publishedYear) ||
      publishedYear < 1000 ||
      publishedYear > 2100
    ) {
      addError(errors, "publishedYear", "Informe um ano entre 1000 e 2100.");
    }
  }

  if (isbn10 !== "" && !/^\d{9}[\dX]$/.test(isbn10)) {
    addError(errors, "isbn10", "Informe um ISBN-10 válido.");
  }

  if (isbn13 !== "" && !/^\d{13}$/.test(isbn13)) {
    addError(errors, "isbn13", "Informe um ISBN-13 com 13 dígitos.");
  }

  const subtitle = optionalText(formData, "subtitle", 200, errors);
  const description = optionalText(formData, "description", 5_000, errors);
  const publisher = optionalText(formData, "publisher", 160, errors);
  const language = optionalText(formData, "language", 35, errors);

  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors, ok: false } as const;
  }

  const progressUnit = progressUnitValue as ProgressUnit;

  return {
    data: {
      authors,
      genres,
      progressUnit,
      status: statusValue as ReadingStatus,
      title,
      type: typeValue as WorkType,
      workId,
      ...(subtitle ? { subtitle } : {}),
      ...(description ? { description } : {}),
      ...(publisher ? { publisher } : {}),
      ...(publishedYear ? { publishedYear } : {}),
      ...(language ? { language } : {}),
      ...(isbn10 ? { isbn10 } : {}),
      ...(isbn13 ? { isbn13 } : {}),
      ...(doi ? { doi } : {}),
      ...(progressUnit === "PAGE" && total ? { pageCount: total } : {}),
      ...(progressUnit === "CHAPTER" && total ? { chapterCount: total } : {}),
    } satisfies UpdateOwnedWorkInput,
    ok: true,
  } as const;
}

export function validateDeleteWorkForm(formData: FormData) {
  const workId = readText(formData, "workId");
  const confirmation = readText(formData, "confirmation");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      workId,
    ) ||
    confirmation !== "DELETE"
  ) {
    return { ok: false } as const;
  }

  return { data: { workId }, ok: true } as const;
}
