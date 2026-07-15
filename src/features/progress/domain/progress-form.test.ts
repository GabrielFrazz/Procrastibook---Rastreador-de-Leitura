import { describe, expect, it } from "vitest";

import { validateProgressForm } from "@/features/progress/domain/progress-form";

function validFormData() {
  const formData = new FormData();
  formData.set("workId", "10000000-0000-4000-8000-000000000001");
  formData.set("expectedPreviousValue", "12.5");
  formData.set("newValue", "18,75");
  formData.set("eventType", "UPDATE");
  return formData;
}

describe("formulário de progresso", () => {
  it("normaliza vírgula decimal e preserva a expectativa de concorrência", () => {
    expect(validateProgressForm(validFormData())).toEqual({
      data: {
        eventType: "UPDATE",
        expectedPreviousValue: 12.5,
        newValue: 18.75,
        workId: "10000000-0000-4000-8000-000000000001",
      },
      ok: true,
    });
  });

  it.each(["-1", "10.123", "", "100000000"])(
    "rejeita valor de progresso inválido: %s",
    (value) => {
      const formData = validFormData();
      formData.set("newValue", value);

      expect(validateProgressForm(formData).ok).toBe(false);
    },
  );

  it("rejeita identificador ou tipo de evento desconhecido", () => {
    const formData = validFormData();
    formData.set("workId", "não-é-uuid");
    formData.set("eventType", "DELETE");

    const result = validateProgressForm(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.workId).toBeDefined();
      expect(result.fieldErrors.eventType).toBeDefined();
    }
  });
});
