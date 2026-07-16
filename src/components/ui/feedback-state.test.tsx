import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyState, ErrorState } from "@/components/ui/feedback-state";

describe("feedback states", () => {
  it("não usa zero literal como ícone do estado vazio", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        description="Adicione sua primeira obra."
        title="Biblioteca vazia"
      />,
    );

    expect(markup).not.toContain(">0<");
    expect(markup).toContain("Biblioteca vazia");
  });

  it("permite erro sem retryHref e sem ação customizada", () => {
    const markup = renderToStaticMarkup(
      <ErrorState
        description="Tente novamente mais tarde."
        title="Falha temporária"
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain("Tentar novamente");
  });

  it("renderiza uma ação customizada quando fornecida", () => {
    const markup = renderToStaticMarkup(
      <ErrorState
        action={<button type="button">Recarregar</button>}
        description="Não foi possível carregar."
        title="Falha"
      />,
    );

    expect(markup).toContain("Recarregar");
  });
});
