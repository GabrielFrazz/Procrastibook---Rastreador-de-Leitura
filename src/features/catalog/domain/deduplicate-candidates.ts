import type { NormalizedWorkCandidate } from "@/features/catalog/domain/catalog-provider";

function identityPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function identityKeys(candidate: NormalizedWorkCandidate) {
  const keys = new Set<string>();

  if (candidate.isbn13) {
    keys.add(`isbn13:${candidate.isbn13}`);
  }

  if (candidate.isbn10) {
    keys.add(`isbn10:${candidate.isbn10}`);
  }

  keys.add(
    `external:${candidate.provider}:${candidate.externalId.toLocaleLowerCase("en-US")}`,
  );

  const title = identityPart(candidate.title);
  const author = candidate.authors[0]
    ? identityPart(candidate.authors[0])
    : null;

  if (title && author && candidate.publishedYear) {
    keys.add(`work:${title}:${author}:${candidate.publishedYear}`);
  }

  return keys;
}

function candidatesMatch(
  first: NormalizedWorkCandidate,
  second: NormalizedWorkCandidate,
) {
  const firstKeys = identityKeys(first);
  return [...identityKeys(second)].some((key) => firstKeys.has(key));
}

function mergeList(
  first: readonly string[],
  second: readonly string[],
  maximumItems: number,
) {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const item of [...first, ...second]) {
    const key = identityPart(item);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(item);

    if (merged.length === maximumItems) {
      break;
    }
  }

  return merged;
}

function mergeCandidates(
  primary: NormalizedWorkCandidate,
  complement: NormalizedWorkCandidate,
): NormalizedWorkCandidate {
  return {
    authors: mergeList(primary.authors, complement.authors, 8),
    coverUrl: primary.coverUrl ?? complement.coverUrl,
    description: primary.description ?? complement.description,
    externalId: primary.externalId,
    genres: mergeList(primary.genres, complement.genres, 10),
    infoUrl: primary.infoUrl ?? complement.infoUrl,
    isbn10: primary.isbn10 ?? complement.isbn10,
    isbn13: primary.isbn13 ?? complement.isbn13,
    language: primary.language ?? complement.language,
    pageCount: primary.pageCount ?? complement.pageCount,
    provider: primary.provider,
    publishedYear: primary.publishedYear ?? complement.publishedYear,
    publisher: primary.publisher ?? complement.publisher,
    subtitle: primary.subtitle ?? complement.subtitle,
    suggestedType: primary.suggestedType,
    title: primary.title,
  };
}

export function deduplicateCandidates(
  candidates: readonly NormalizedWorkCandidate[],
) {
  const results: NormalizedWorkCandidate[] = [];

  for (const candidate of candidates) {
    let primaryIndex: number | null = null;

    for (let index = 0; index < results.length; index += 1) {
      const existing = results[index];

      if (!existing || !candidatesMatch(existing, candidate)) {
        continue;
      }

      if (primaryIndex === null) {
        results[index] = mergeCandidates(existing, candidate);
        primaryIndex = index;
        continue;
      }

      const primary = results[primaryIndex];

      if (primary) {
        results[primaryIndex] = mergeCandidates(primary, existing);
      }

      results.splice(index, 1);
      index -= 1;
    }

    if (primaryIndex === null) {
      results.push(candidate);
    }
  }

  return results;
}
