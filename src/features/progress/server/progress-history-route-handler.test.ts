import { describe, expect, it, vi } from "vitest";

import {
  handleProgressHistoryRequest,
  type ProgressHistoryRouteDependencies,
} from "@/features/progress/server/progress-history-route-handler";

const workId = "10000000-0000-4000-8000-000000000001";

function dependencies(
  overrides: Partial<ProgressHistoryRouteDependencies> = {},
): ProgressHistoryRouteDependencies {
  return {
    getHistory: async () => ({ items: [], nextPage: null, total: 0 }),
    getUserId: async () => "user-a",
    ...overrides,
  };
}

describe("handleProgressHistoryRequest", () => {
  it("exige autenticação antes de consultar dados", async () => {
    const getHistory = vi.fn<ProgressHistoryRouteDependencies["getHistory"]>();
    const response = await handleProgressHistoryRequest(
      new Request(`http://localhost/api/progress/history?workId=${workId}`),
      dependencies({ getHistory, getUserId: async () => null }),
    );

    expect(response.status).toBe(401);
    expect(getHistory).not.toHaveBeenCalled();
  });

  it("encaminha uma consulta autenticada e impede cache", async () => {
    const getHistory = vi.fn<ProgressHistoryRouteDependencies["getHistory"]>(
      async () => ({ items: [], nextPage: 2, total: 11 }),
    );
    const response = await handleProgressHistoryRequest(
      new Request(
        `http://localhost/api/progress/history?workId=${workId}&page=1`,
      ),
      dependencies({ getHistory }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(getHistory).toHaveBeenCalledWith("user-a", { page: 1, workId });
  });

  it("rejeita consulta inválida sem acessar o repositório", async () => {
    const getHistory = vi.fn<ProgressHistoryRouteDependencies["getHistory"]>();
    const response = await handleProgressHistoryRequest(
      new Request("http://localhost/api/progress/history?workId=inválido"),
      dependencies({ getHistory }),
    );

    expect(response.status).toBe(400);
    expect(getHistory).not.toHaveBeenCalled();
  });

  it("não expõe detalhes privados de falhas do repositório", async () => {
    const response = await handleProgressHistoryRequest(
      new Request(`http://localhost/api/progress/history?workId=${workId}`),
      dependencies({
        getHistory: async () => {
          throw new Error("detalhe privado");
        },
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("detalhe privado");
  });
});
