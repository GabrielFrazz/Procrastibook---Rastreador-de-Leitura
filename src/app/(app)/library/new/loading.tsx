import { Card, LoadingState, PageHeader } from "@/components/ui";

export default function AddWorkLoading() {
  return (
    <div className="add-work">
      <PageHeader
        description="Preparando o formulário de cadastro."
        eyebrow="Nova leitura"
        title="Adicionar obra"
      />
      <Card as="section">
        <LoadingState description="Carregando formulário…" />
      </Card>
    </div>
  );
}
