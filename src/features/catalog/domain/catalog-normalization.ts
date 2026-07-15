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

export function normalizeCatalogText(
  value: string | undefined,
  maximumLength: number,
) {
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

export function normalizeCatalogList(
  values: readonly string[] | undefined,
  maximumItems: number,
  maximumLength: number,
) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values ?? []) {
    const item = normalizeCatalogText(value, maximumLength);
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

export function normalizeCatalogUrl(value: string | undefined) {
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

export function normalizePublishedYear(value: number | string | undefined) {
  const year =
    typeof value === "number"
      ? value
      : Number(value?.match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1]);

  return Number.isInteger(year) && year >= 1000 && year <= 2100 ? year : null;
}

export function normalizeIsbn(
  value: string | undefined,
  type: "ISBN_10" | "ISBN_13",
) {
  const normalized = value?.replace(/[\s-]/g, "").toUpperCase();

  if (type === "ISBN_10") {
    return normalized && /^\d{9}[\dX]$/.test(normalized) ? normalized : null;
  }

  return normalized && /^\d{13}$/.test(normalized) ? normalized : null;
}

export function normalizePageCount(value: number | undefined) {
  return value && Number.isInteger(value) && value > 0 && value <= 10_000_000
    ? value
    : null;
}
