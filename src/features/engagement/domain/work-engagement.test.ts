import { describe, expect, it } from "vitest";

import {
  validateReviewForm,
  validateWorkNoteForm,
} from "@/features/engagement/domain/work-engagement";

const workId = "10000000-0000-4000-8000-000000000001";
const sessionId = "40000000-0000-4000-8000-000000000001";
const noteId = "50000000-0000-4000-8000-000000000001";

describe("formulário de review", () => {
  it("normaliza nota e comentário opcional", () => {
    const formData = new FormData();
    formData.set("workId", workId);
    formData.set("rating", "4");
    formData.set("body", "  Excelente construção de mundo.  ");

    expect(validateReviewForm(formData)).toEqual({
      data: {
        body: "Excelente construção de mundo.",
        rating: 4,
        workId,
      },
      ok: true,
    });
  });

  it.each(["0", "3.5", "6", "texto"])("rejeita a nota %s", (rating) => {
    const formData = new FormData();
    formData.set("workId", workId);
    formData.set("rating", rating);
    formData.set("body", "");

    expect(validateReviewForm(formData).ok).toBe(false);
  });

  it("limita o tamanho do comentário", () => {
    const formData = new FormData();
    formData.set("workId", workId);
    formData.set("rating", "5");
    formData.set("body", "a".repeat(5_001));

    expect(validateReviewForm(formData).ok).toBe(false);
  });
});

describe("formulário de anotações e citações", () => {
  it("normaliza uma citação vinculada a sessão", () => {
    const formData = new FormData();
    formData.set("intent", "CREATE");
    formData.set("workId", workId);
    formData.set("kind", "QUOTE");
    formData.set("content", "  Uma frase importante.  ");
    formData.set("locationLabel", "  página 42  ");
    formData.set("sessionId", sessionId);

    expect(validateWorkNoteForm(formData)).toEqual({
      data: {
        content: "Uma frase importante.",
        intent: "CREATE",
        kind: "QUOTE",
        locationLabel: "página 42",
        sessionId,
        workId,
      },
      ok: true,
    });
  });

  it("exige conteúdo e limita localização", () => {
    const formData = new FormData();
    formData.set("intent", "CREATE");
    formData.set("workId", workId);
    formData.set("kind", "NOTE");
    formData.set("content", "   ");
    formData.set("locationLabel", "a".repeat(121));
    formData.set("sessionId", "");

    const result = validateWorkNoteForm(formData);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors.content).toBeDefined();
    expect(!result.ok && result.fieldErrors.locationLabel).toBeDefined();
  });

  it("valida o comando de exclusão", () => {
    const formData = new FormData();
    formData.set("intent", "DELETE");
    formData.set("workId", workId);
    formData.set("noteId", noteId);

    expect(validateWorkNoteForm(formData)).toEqual({
      data: { intent: "DELETE", noteId, workId },
      ok: true,
    });
  });
});
