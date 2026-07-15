import {
  validateCatalogQuery,
  type CatalogQuery,
  type NormalizedWorkCandidate,
} from "@/features/catalog/domain/catalog-provider";
import type { RateLimitDecision } from "@/features/catalog/server/catalog-rate-limiter";

export type CatalogRouteDependencies = Readonly<{
  consumeRateLimit: (userId: string) => RateLimitDecision;
  getUserId: () => Promise<string | null>;
  search: (query: CatalogQuery) => Promise<readonly NormalizedWorkCandidate[]>;
}>;

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Readonly<Record<string, unknown>> = {},
) {
  return Response.json(
    { error: { code, message, ...extra } },
    { headers: noStoreHeaders, status },
  );
}

export async function handleCatalogSearchRequest(
  request: Request,
  dependencies: CatalogRouteDependencies,
) {
  const userId = await dependencies.getUserId();

  if (!userId) {
    return errorResponse(401, "AUTH_REQUIRED", "Entre novamente para buscar.");
  }

  const rateLimit = dependencies.consumeRateLimit(userId);

  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Muitas buscas em pouco tempo. Aguarde e tente novamente.",
        },
      },
      {
        headers: {
          ...noStoreHeaders,
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
        status: 429,
      },
    );
  }

  const url = new URL(request.url);
  const validation = validateCatalogQuery({
    language: url.searchParams.get("language") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    query: url.searchParams.get("q") ?? undefined,
  });

  if (!validation.ok) {
    return errorResponse(400, "INVALID_QUERY", "Revise os dados da busca.", {
      fieldErrors: validation.fieldErrors,
    });
  }

  try {
    const candidates = await dependencies.search(validation.data);
    return Response.json(
      { data: candidates },
      { headers: noStoreHeaders, status: 200 },
    );
  } catch {
    return errorResponse(
      503,
      "CATALOG_UNAVAILABLE",
      "Os catálogos estão temporariamente indisponíveis.",
    );
  }
}
