import { deduplicateCandidates } from "@/features/catalog/domain/deduplicate-candidates";
import {
  CatalogProviderError,
  type CatalogProvider,
  type CatalogQuery,
  type NormalizedWorkCandidate,
} from "@/features/catalog/domain/catalog-provider";

type CatalogSearchServiceOptions = Readonly<{
  fallback: CatalogProvider;
  primary: CatalogProvider;
}>;

function hasIncompleteIdentity(candidate: NormalizedWorkCandidate) {
  return (
    candidate.authors.length === 0 || (!candidate.isbn10 && !candidate.isbn13)
  );
}

function shouldUseFallback(
  candidates: readonly NormalizedWorkCandidate[],
  limit: number,
) {
  return candidates.length < limit || candidates.some(hasIncompleteIdentity);
}

export class CatalogSearchService {
  private readonly fallback: CatalogProvider;
  private readonly primary: CatalogProvider;

  constructor(options: CatalogSearchServiceOptions) {
    this.fallback = options.fallback;
    this.primary = options.primary;
  }

  async search(query: CatalogQuery) {
    let primaryCandidates: readonly NormalizedWorkCandidate[] = [];
    let primaryError: unknown = null;
    let primarySucceeded = false;

    try {
      primaryCandidates = await this.primary.search(query);
      primarySucceeded = true;
    } catch (error) {
      primaryError = error;
    }

    if (
      primarySucceeded &&
      !shouldUseFallback(primaryCandidates, query.limit)
    ) {
      return deduplicateCandidates(primaryCandidates).slice(0, query.limit);
    }

    try {
      const fallbackCandidates = await this.fallback.search(query);
      return deduplicateCandidates([
        ...primaryCandidates,
        ...fallbackCandidates,
      ]).slice(0, query.limit);
    } catch (fallbackError) {
      if (primarySucceeded && primaryCandidates.length > 0) {
        return deduplicateCandidates(primaryCandidates).slice(0, query.limit);
      }

      throw new CatalogProviderError("UNAVAILABLE", {
        cause: new AggregateError(
          [primaryError, fallbackError].filter((error) => error !== null),
          "All catalog providers failed.",
        ),
      });
    }
  }
}
