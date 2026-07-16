import { PageHeader, Skeleton } from "@/components/ui";

export default function AddWorkLoading() {
  return (
    <div className="add-work">
      <PageHeader
        description="Preparando o formulário de cadastro."
        eyebrow="Nova leitura"
        title="Adicionar obra"
      />

      <section
        aria-label="Carregando busca nos catálogos"
        className="catalog-search"
      >
        <div className="catalog-search__heading">
          <Skeleton height="2.75rem" variant="rect" width="2.75rem" />
          <div className="add-work-loading__heading-lines">
            <Skeleton variant="text" width="7rem" />
            <Skeleton variant="text" width="12rem" />
          </div>
        </div>
        <div className="catalog-search__form">
          <Skeleton height="4.5rem" variant="rect" width="100%" />
          <Skeleton height="2.75rem" variant="rect" width="7rem" />
        </div>
      </section>

      <div className="add-work-form__layout" role="status">
        <span className="sr-only">Carregando formulário…</span>
        <section className="add-cover">
          <div className="add-work-loading__heading-lines">
            <Skeleton variant="text" width="5rem" />
            <Skeleton variant="text" width="9rem" />
          </div>
          <Skeleton
            className="add-cover__preview"
            variant="cover"
            width="100%"
          />
          <Skeleton height="4.5rem" variant="rect" width="100%" />
        </section>
        <section className="add-work-fields">
          <div className="add-work-loading__heading-lines">
            <Skeleton variant="text" width="7rem" />
            <Skeleton variant="text" width="13rem" />
          </div>
          {["principal", "organizacao", "detalhes"].map((section) => (
            <div className="add-work-loading__fieldset" key={section}>
              <Skeleton variant="text" width="11rem" />
              <div className="add-work-fields__grid">
                <Skeleton height="4.5rem" variant="rect" width="100%" />
                <Skeleton height="4.5rem" variant="rect" width="100%" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
