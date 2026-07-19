import { describe, expect, it } from "vitest";

import {
  formatReadingDuration,
  getDateKeyInTimezone,
  summarizeReadingSessions,
  validateReadingSessionForm,
  type ReadingSessionItem,
} from "@/features/reading/domain/reading-sessions";

const workId = "10000000-0000-4000-8000-000000000001";

function validFormData() {
  return new FormData();
}

function appendValidFields(formData: FormData) {
  formData.set("workId", workId);
  formData.set("occurredOn", "2026-07-15");
  formData.set("durationMinutes", "45");
  formData.set("endPosition", "35,5");
  formData.set("notes", "Sessão noturna.");
  return formData;
}

describe("formulário de sessão de leitura", () => {
  it("normaliza duração, posições e anotação", () => {
    const result = validateReadingSessionForm(
      appendValidFields(validFormData()),
    );

    expect(result).toEqual({
      data: {
        durationSeconds: 2_700,
        endPosition: 35.5,
        notes: "Sessão noturna.",
        occurredOn: "2026-07-15",
        workId,
      },
      ok: true,
    });
  });

  it.each(["0", "-5", "1.5", "1441", "texto"])(
    "rejeita duração inválida: %s",
    (durationMinutes) => {
      const formData = appendValidFields(validFormData());
      formData.set("durationMinutes", durationMinutes);

      expect(validateReadingSessionForm(formData).ok).toBe(false);
    },
  );

  it("exige a posição final", () => {
    const formData = appendValidFields(validFormData());
    formData.set("endPosition", "");

    const result = validateReadingSessionForm(formData);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors.endPosition).toBeDefined();
  });

  it("rejeita data inexistente e payload de notas excessivo", () => {
    const formData = appendValidFields(validFormData());
    formData.set("occurredOn", "2026-02-30");
    formData.set("notes", "a".repeat(2_001));

    const result = validateReadingSessionForm(formData);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors.occurredOn).toBeDefined();
    expect(!result.ok && result.fieldErrors.notes).toBeDefined();
  });
});

describe("resumo de sessões", () => {
  const baseSession: ReadingSessionItem = {
    createdAt: "2026-07-15T12:00:00.000Z",
    durationSeconds: 1_800,
    endPosition: 30,
    id: "20000000-0000-4000-8000-000000000001",
    notes: null,
    occurredOn: "2026-07-15",
    progressUnit: "PAGE",
    startPosition: 10,
    workId,
    workTitle: "Obra",
  };

  it("agrega tempo e unidades sem misturar páginas, capítulos e percentual", () => {
    const summary = summarizeReadingSessions([
      baseSession,
      {
        ...baseSession,
        durationSeconds: 900,
        endPosition: 5,
        id: "20000000-0000-4000-8000-000000000002",
        progressUnit: "CHAPTER",
        startPosition: 2,
      },
      {
        ...baseSession,
        durationSeconds: 600,
        endPosition: 32.5,
        id: "20000000-0000-4000-8000-000000000003",
        progressUnit: "PERCENT",
        startPosition: 20,
      },
    ]);

    expect(summary).toEqual({
      chaptersRead: 3,
      pagesRead: 20,
      percentPointsRead: 12.5,
      sessionCount: 3,
      totalDurationSeconds: 3_300,
    });
  });

  it("formata duração e obtém a data no fuso configurado", () => {
    expect(formatReadingDuration(5_400)).toBe("1 h 30 min");
    expect(
      getDateKeyInTimezone(
        new Date("2026-07-16T01:00:00.000Z"),
        "America/Sao_Paulo",
      ),
    ).toBe("2026-07-15");
  });
});
