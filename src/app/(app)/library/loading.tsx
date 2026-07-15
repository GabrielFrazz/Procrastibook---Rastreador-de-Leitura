import { Card, LoadingState, PageHeader } from "@/components/ui";

export default function LibraryLoading() {
  return (
    <div className="library">
      <PageHeader
        description="Carregando as obras da sua estante."
        eyebrow="Sua coleção"
        title="Biblioteca"
      />
      <Card as="section">
        <LoadingState description="Carregando biblioteca…" />
      </Card>
    </div>
  );
}
