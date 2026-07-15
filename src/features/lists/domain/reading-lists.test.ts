import { describe, expect, it } from "vitest";

import {
  validateCreateReadingList,
  validateManageReadingList,
} from "@/features/lists/domain/reading-lists";

describe("formulários de listas", () => {
  it("normaliza uma nova lista e remove descrição vazia", () => {
    const formData = new FormData();
    formData.set("name", "  Férias  ");
    formData.set("description", "");

    expect(validateCreateReadingList(formData)).toEqual({
      data: { name: "Férias" },
      ok: true,
    });
  });

  it("rejeita nome vazio ou acima do limite", () => {
    const empty = new FormData();
    empty.set("name", "   ");
    const long = new FormData();
    long.set("name", "a".repeat(81));

    expect(validateCreateReadingList(empty).ok).toBe(false);
    expect(validateCreateReadingList(long).ok).toBe(false);
  });

  it("valida associação com identificadores UUID", () => {
    const formData = new FormData();
    formData.set("intent", "ADD_ITEM");
    formData.set("listId", "30000000-0000-4000-8000-00000000000a");
    formData.set("workId", "10000000-0000-4000-8000-00000000000a");

    expect(validateManageReadingList(formData)).toEqual({
      data: {
        intent: "ADD_ITEM",
        listId: "30000000-0000-4000-8000-00000000000a",
        workId: "10000000-0000-4000-8000-00000000000a",
      },
      ok: true,
    });
  });

  it("não exige obra ao excluir uma lista", () => {
    const formData = new FormData();
    formData.set("intent", "DELETE_LIST");
    formData.set("listId", "30000000-0000-4000-8000-00000000000a");

    expect(validateManageReadingList(formData).ok).toBe(true);
  });
});
