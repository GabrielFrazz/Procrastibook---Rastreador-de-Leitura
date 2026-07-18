import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyState, ErrorState } from "@/components/ui/feedback-state";
import { FormStatusMessage } from "@/components/ui/form-status-message";

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

  it("diferencia mensagens de formulário por semântica", () => {
    const errorMarkup = renderToStaticMarkup(
      <FormStatusMessage message="Revise os campos." status="error" />,
    );
    const successMarkup = renderToStaticMarkup(
      <FormStatusMessage message="Alterações salvas." status="success" />,
    );

    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain("ui-form-status--error");
    expect(successMarkup).toContain('role="status"');
    expect(successMarkup).toContain("ui-form-status--success");
  });

  it("não renderiza mensagem de formulário ociosa", () => {
    const markup = renderToStaticMarkup(
      <FormStatusMessage message={null} status="idle" />,
    );

    expect(markup).toBe("");
  });
});
