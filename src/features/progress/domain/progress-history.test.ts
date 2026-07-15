import { describe, expect, it } from "vitest";

import {
  formatProgressHistoryValue,
  parseProgressHistoryResponse,
  validateProgressHistoryQuery,
} from "@/features/progress/domain/progress-history";

describe("contrato do histórico de progresso", () => {
  it("valida UUID e normaliza a página", () => {
    const params = new URLSearchParams({
      page: "2",
      workId: "10000000-0000-4000-8000-000000000001",
    });

    expect(validateProgressHistoryQuery(params)).toEqual({
      data: {
        page: 2,
        workId: "10000000-0000-4000-8000-000000000001",
      },
      ok: true,
    });
  });

  it.each(["-1", "1.5", "1001", "texto"])(
    "rejeita página inválida: %s",
    (page) => {
      const params = new URLSearchParams({
        page,
        workId: "10000000-0000-4000-8000-000000000001",
      });

      expect(validateProgressHistoryQuery(params).ok).toBe(false);
    },
  );

  it("rejeita resposta que não respeita o contrato público", () => {
    expect(parseProgressHistoryResponse({ data: { items: [] } })).toBeNull();
  });

  it("formata páginas, capítulos e percentual em português", () => {
    expect(formatProgressHistoryValue(1, "PAGE")).toBe("1 página");
    expect(formatProgressHistoryValue(2.5, "CHAPTER")).toBe("2,5 capítulos");
    expect(formatProgressHistoryValue(42, "PERCENT")).toBe("42%");
  });
});
