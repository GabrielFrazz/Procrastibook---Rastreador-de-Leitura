import "server-only";

import { unstable_cache } from "next/cache";

import type {
  CatalogQuery,
  NormalizedWorkCandidate,
} from "@/features/catalog/domain/catalog-provider";
import { GoogleBooksProvider } from "@/features/catalog/providers/google-books-provider";
import { OpenLibraryProvider } from "@/features/catalog/providers/open-library-provider";
import { CatalogSearchService } from "@/features/catalog/services/catalog-search-service";
import { getCatalogServerConfig } from "@/features/catalog/server/catalog-server-config";

export const CATALOG_CACHE_SECONDS = 24 * 60 * 60;

async function searchWithoutCache(
  query: CatalogQuery,
): Promise<readonly NormalizedWorkCandidate[]> {
  const config = getCatalogServerConfig();
  const service = new CatalogSearchService({
    fallback: new OpenLibraryProvider({
      userAgent: config.openLibraryUserAgent,
    }),
    primary: new GoogleBooksProvider({
      ...(config.googleBooksApiKey ? { apiKey: config.googleBooksApiKey } : {}),
    }),
  });

  return service.search(query);
}

const cachedSearch = unstable_cache(searchWithoutCache, ["catalog-search-v1"], {
  revalidate: CATALOG_CACHE_SECONDS,
});

export async function searchCachedCatalog(query: CatalogQuery) {
  return cachedSearch(query);
}
