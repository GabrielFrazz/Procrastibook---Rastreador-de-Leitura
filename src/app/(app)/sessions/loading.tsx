import { PageHeader, Skeleton } from "@/components/ui";

export default function ReadingSessionsLoading() {
  return (
    <div className="reading-sessions">
      <PageHeader
        description="Registre tempo e avanço de cada momento de leitura."
        eyebrow="Sua rotina"
        title="Sessões de leitura"
      />
      <div
        aria-busy="true"
        aria-label="Carregando sessões"
        className="reading-session-loading"
        role="status"
      >
        <span className="sr-only">Carregando sessões…</span>
        <div className="reading-session-loading__summary">
          <Skeleton height="5.5rem" width="100%" />
          <Skeleton height="5.5rem" width="100%" />
          <Skeleton height="5.5rem" width="100%" />
        </div>
        <Skeleton height="20rem" width="100%" />
        <div className="reading-session-loading__list">
          <Skeleton height="10rem" width="100%" />
          <Skeleton height="10rem" width="100%" />
        </div>
      </div>
    </div>
  );
}
