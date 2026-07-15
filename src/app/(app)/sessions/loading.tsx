import { LoadingState, PageHeader } from "@/components/ui";

export default function ReadingSessionsLoading() {
  return (
    <div className="reading-sessions">
      <PageHeader
        description="Registre tempo e avanço de cada momento de leitura."
        eyebrow="Sua rotina"
        title="Sessões de leitura"
      />
      <LoadingState description="Carregando sessões de leitura…" />
    </div>
  );
}
