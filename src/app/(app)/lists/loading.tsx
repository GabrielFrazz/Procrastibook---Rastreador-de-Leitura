import { Card, LoadingState, PageHeader } from "@/components/ui";

export default function ReadingListsLoading() {
  return (
    <div className="reading-lists">
      <PageHeader
        description="Carregando sua organização pessoal."
        eyebrow="Organização pessoal"
        title="Listas"
      />
      <Card as="section">
        <LoadingState description="Carregando listas…" />
      </Card>
    </div>
  );
}
