import type { Database } from "@/lib/supabase/database.types";

type WorkType = Database["public"]["Enums"]["work_type"];
type ProgressUnit = Database["public"]["Enums"]["progress_unit"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type ExternalProvider = Database["public"]["Enums"]["external_provider"];

export type WorkFormField =
  | "authors"
  | "cover"
  | "coverExternalUrl"
  | "description"
  | "externalId"
  | "externalProvider"
  | "genres"
  | "isbn10"
  | "isbn13"
  | "language"
  | "progressUnit"
  | "publishedYear"
  | "publisher"
  | "startedAt"
  | "status"
  | "subtitle"
  | "title"
  | "total"
  | "type";

export type WorkFormState = Readonly<{
  fieldErrors: Partial<Record<WorkFormField, readonly string[]>>;
  message: string | null;
  status: "error" | "idle";
}>;

export const INITIAL_WORK_FORM_STATE: WorkFormState = {
  fieldErrors: {},
  message: null,
  status: "idle",
};

export type ManualWorkInput = Readonly<{
  authors: readonly string[];
  chapterCount?: number;
  coverFile: File | null;
  description?: string;
  externalSource?: Readonly<{
    coverUrl?: string;
    externalId: string;
    isbn10?: string;
    provider: ExternalProvider;
  }>;
  genres: readonly string[];
  isbn13?: string;
  language?: string;
  pageCount?: number;
  progressUnit: ProgressUnit;
  publishedYear?: number;
  publisher?: string;
  startedAt?: string;
  status: ReadingStatus;
  subtitle?: string;
  title: string;
  type: WorkType;
}>;

export type WorkValidationResult =
  | Readonly<{ data: ManualWorkInput; ok: true }>
  | Readonly<{
      fieldErrors: Partial<Record<WorkFormField, readonly string[]>>;
      ok: false;
    }>;

const workTypes: readonly WorkType[] = ["BOOK", "MANGA", "ARTICLE", "EBOOK"];
const progressUnits: readonly ProgressUnit[] = ["PAGE", "CHAPTER", "PERCENT"];
const readingStatuses: readonly ReadingStatus[] = [
  "WANT_TO_READ",
  "READING",
  "FINISHED",
  "ABANDONED",
];
const externalProviders: readonly ExternalProvider[] = [
  "GOOGLE_BOOKS",
  "OPEN_LIBRARY",
];
const allowedCoverTypes = ["image/jpeg", "image/png", "image/webp"];
const maxCoverSize = 2 * 1024 * 1024;

function readText(formData: FormData, field: WorkFormField) {
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
  errors: Partial<Record<WorkFormField, string[]>>,
  field: WorkFormField,
  message: string,
) {
  errors[field] = [...(errors[field] ?? []), message];
}

function optionalText(
  formData: FormData,
  field: WorkFormField,
  maximumLength: number,
  errors: Partial<Record<WorkFormField, string[]>>,
) {
  const value = readText(formData, field);

  if (value.length > maximumLength) {
    addError(errors, field, `Use no máximo ${maximumLength} caracteres.`);
  }

  return value || undefined;
}

export function createWorkErrorState(
  message: string,
  fieldErrors: WorkFormState["fieldErrors"] = {},
): WorkFormState {
  return { fieldErrors, message, status: "error" };
}

export function validateWorkForm(formData: FormData): WorkValidationResult {
  const errors: Partial<Record<WorkFormField, string[]>> = {};
  const title = readText(formData, "title");
  const authors = splitValues(readText(formData, "authors"), /;/);
  const genres = splitValues(readText(formData, "genres"), /[,;]/);
  const typeValue = readText(formData, "type");
  const progressUnitValue = readText(formData, "progressUnit");
  const statusValue = readText(formData, "status");
  const totalValue = readText(formData, "total");
  const publishedYearValue = readText(formData, "publishedYear");
  const startedAtValue = readText(formData, "startedAt");
  const rawIsbn = readText(formData, "isbn13");
  const isbn13 = rawIsbn.replace(/[\s-]/g, "");
  const externalProviderValue = readText(formData, "externalProvider");
  const externalId = readText(formData, "externalId");
  const rawIsbn10 = readText(formData, "isbn10");
  const isbn10 = rawIsbn10.replace(/[\s-]/g, "").toUpperCase();
  const coverExternalUrl = readText(formData, "coverExternalUrl");
  const coverValue = formData.get("cover");
  const coverFile =
    typeof File !== "undefined" &&
    coverValue instanceof File &&
    coverValue.size > 0
      ? coverValue
      : null;

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

  if (!progressUnits.includes(progressUnitValue as ProgressUnit)) {
    addError(errors, "progressUnit", "Selecione uma unidade válida.");
  }

  if (!readingStatuses.includes(statusValue as ReadingStatus)) {
    addError(errors, "status", "Selecione um status válido.");
  }

  if (progressUnitValue === "CHAPTER" && typeValue !== "MANGA") {
    addError(
      errors,
      "progressUnit",
      "Capítulos estão disponíveis apenas para mangás.",
    );
  }

  let total: number | undefined;
  if (progressUnitValue !== "PERCENT" && totalValue !== "") {
    total = Number(totalValue);

    if (!Number.isInteger(total) || total < 1 || total > 10_000_000) {
      addError(errors, "total", "Informe um total inteiro maior que zero.");
    }
  }

  let publishedYear: number | undefined;
  if (publishedYearValue !== "") {
    publishedYear = Number(publishedYearValue);

    if (
      !Number.isInteger(publishedYear) ||
      publishedYear < 1000 ||
      publishedYear > 2100
    ) {
      addError(errors, "publishedYear", "Informe um ano entre 1000 e 2100.");
    }
  }

  if (rawIsbn !== "" && !/^\d{13}$/.test(isbn13)) {
    addError(errors, "isbn13", "Informe um ISBN-13 com 13 dígitos.");
  }

  const hasExternalSource =
    externalProviderValue !== "" ||
    externalId !== "" ||
    rawIsbn10 !== "" ||
    coverExternalUrl !== "";

  if (
    hasExternalSource &&
    !externalProviders.includes(externalProviderValue as ExternalProvider)
  ) {
    addError(errors, "externalProvider", "Provedor externo inválido.");
  }

  if (hasExternalSource && (externalId === "" || externalId.length > 256)) {
    addError(errors, "externalId", "Referência externa inválida.");
  }

  if (rawIsbn10 !== "" && !/^\d{9}[\dX]$/.test(isbn10)) {
    addError(errors, "isbn10", "ISBN-10 externo inválido.");
  }

  if (coverExternalUrl !== "") {
    try {
      const url = new URL(coverExternalUrl);
      const trustedHosts =
        externalProviderValue === "OPEN_LIBRARY"
          ? ["covers.openlibrary.org"]
          : ["books.google.com", "books.googleusercontent.com"];

      if (url.protocol !== "https:" || !trustedHosts.includes(url.hostname)) {
        addError(errors, "coverExternalUrl", "URL de capa externa inválida.");
      }
    } catch {
      addError(errors, "coverExternalUrl", "URL de capa externa inválida.");
    }
  }
  if (startedAtValue !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(startedAtValue)) {
    addError(errors, "startedAt", "Informe uma data válida.");
  }

  if (coverFile && !allowedCoverTypes.includes(coverFile.type)) {
    addError(errors, "cover", "Use uma imagem JPEG, PNG ou WebP.");
  }

  if (coverFile && coverFile.size > maxCoverSize) {
    addError(errors, "cover", "A capa deve ter no máximo 2 MB.");
  }

  const subtitle = optionalText(formData, "subtitle", 200, errors);
  const description = optionalText(formData, "description", 5000, errors);
  const publisher = optionalText(formData, "publisher", 160, errors);
  const language = optionalText(formData, "language", 35, errors);

  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors, ok: false };
  }

  const type = typeValue as WorkType;
  const progressUnit = progressUnitValue as ProgressUnit;

  return {
    data: {
      authors,
      coverFile,
      genres,
      progressUnit,
      status: statusValue as ReadingStatus,
      title,
      type,
      ...(subtitle ? { subtitle } : {}),
      ...(description ? { description } : {}),
      ...(hasExternalSource
        ? {
            externalSource: {
              externalId,
              provider: externalProviderValue as ExternalProvider,
              ...(coverExternalUrl ? { coverUrl: coverExternalUrl } : {}),
              ...(isbn10 ? { isbn10 } : {}),
            },
          }
        : {}),
      ...(publisher ? { publisher } : {}),
      ...(publishedYear ? { publishedYear } : {}),
      ...(language ? { language } : {}),
      ...(isbn13 ? { isbn13 } : {}),
      ...(startedAtValue
        ? { startedAt: `${startedAtValue}T12:00:00.000Z` }
        : {}),
      ...(progressUnit === "PAGE" && total ? { pageCount: total } : {}),
      ...(progressUnit === "CHAPTER" && total ? { chapterCount: total } : {}),
    },
    ok: true,
  };
}
