import { describe, expect, it } from "vitest";

import { validateWorkForm } from "@/features/works/domain/work-form";

function createValidForm() {
  const formData = new FormData();
  formData.set("title", "Olhos d'água");
  formData.set("authors", "Conceição Evaristo; Outra Autora");
  formData.set("genres", "Contos, Literatura brasileira");
  formData.set("type", "BOOK");
  formData.set("progressUnit", "PAGE");
  formData.set("status", "WANT_TO_READ");
  formData.set("total", "116");
  return formData;
}

describe("validação do cadastro manual", () => {
  it("normaliza dados válidos e listas sem duplicatas", () => {
    const formData = createValidForm();
    formData.set(
      "authors",
      "Conceição Evaristo; conceição evaristo; Outra Autora",
    );
    formData.set("isbn13", "978-85-359-0277-5");

    const result = validateWorkForm(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.authors).toEqual([
        "Conceição Evaristo",
        "Outra Autora",
      ]);
      expect(result.data.isbn13).toBe("9788535902775");
      expect(result.data.pageCount).toBe(116);
    }
  });

  it("exige título e pelo menos um autor", () => {
    const formData = createValidForm();
    formData.set("title", "");
    formData.set("authors", "");

    const result = validateWorkForm(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.title).toBeDefined();
      expect(result.fieldErrors.authors).toBeDefined();
    }
  });

  it("permite capítulos somente para mangás", () => {
    const formData = createValidForm();
    formData.set("progressUnit", "CHAPTER");

    const invalid = validateWorkForm(formData);
    formData.set("type", "MANGA");
    const valid = validateWorkForm(formData);

    expect(invalid.ok).toBe(false);
    expect(valid.ok).toBe(true);
  });

  it("ignora total no modo percentual", () => {
    const formData = createValidForm();
    formData.set("progressUnit", "PERCENT");
    formData.set("total", "valor inválido");

    const result = validateWorkForm(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pageCount).toBeUndefined();
      expect(result.data.chapterCount).toBeUndefined();
    }
  });

  it("bloqueia ISBN, total e ano inválidos", () => {
    const formData = createValidForm();
    formData.set("isbn13", "123");
    formData.set("total", "-1");
    formData.set("publishedYear", "999");

    const result = validateWorkForm(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.isbn13).toBeDefined();
      expect(result.fieldErrors.total).toBeDefined();
      expect(result.fieldErrors.publishedYear).toBeDefined();
    }
  });

  it("normaliza a referência selecionada no catálogo", () => {
    const formData = createValidForm();
    formData.set("externalProvider", "OPEN_LIBRARY");
    formData.set("externalId", "/works/OL45804W");
    formData.set("isbn10", "85-359-0277-5");
    formData.set(
      "coverExternalUrl",
      "https://covers.openlibrary.org/b/id/8231856-L.jpg?default=false",
    );

    const result = validateWorkForm(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.externalSource).toEqual({
        coverUrl:
          "https://covers.openlibrary.org/b/id/8231856-L.jpg?default=false",
        externalId: "/works/OL45804W",
        isbn10: "8535902775",
        provider: "OPEN_LIBRARY",
      });
    }
  });

  it("rejeita capa externa fora dos hosts dos provedores", () => {
    const formData = createValidForm();
    formData.set("externalProvider", "GOOGLE_BOOKS");
    formData.set("externalId", "google-1");
    formData.set("coverExternalUrl", "https://tracker.example/capa.jpg");

    const result = validateWorkForm(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.coverExternalUrl).toBeDefined();
    }
  });
});
