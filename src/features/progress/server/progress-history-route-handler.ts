import {
  type ProgressHistoryPage,
  type ProgressHistoryQuery,
  validateProgressHistoryQuery,
} from "@/features/progress/domain/progress-history";

export type ProgressHistoryRouteDependencies = Readonly<{
  getHistory: (
    userId: string,
    query: ProgressHistoryQuery,
  ) => Promise<ProgressHistoryPage>;
  getUserId: () => Promise<string | null>;
}>;

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return Response.json(
    { error: { code, message } },
    { headers: noStoreHeaders, status },
  );
}

export async function handleProgressHistoryRequest(
  request: Request,
  dependencies: ProgressHistoryRouteDependencies,
) {
  const userId = await dependencies.getUserId();

  if (!userId) {
    return errorResponse(
      401,
      "AUTH_REQUIRED",
      "Entre novamente para consultar o histórico.",
    );
  }

  const validation = validateProgressHistoryQuery(
    new URL(request.url).searchParams,
  );

  if (!validation.ok) {
    return errorResponse(400, "INVALID_QUERY", "Revise os dados do histórico.");
  }

  try {
    const page = await dependencies.getHistory(userId, validation.data);
    return Response.json(
      { data: page },
      { headers: noStoreHeaders, status: 200 },
    );
  } catch {
    return errorResponse(
      503,
      "HISTORY_UNAVAILABLE",
      "O histórico está temporariamente indisponível.",
    );
  }
}
