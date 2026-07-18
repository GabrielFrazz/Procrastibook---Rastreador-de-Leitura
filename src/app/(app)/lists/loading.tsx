import { PageHeader, Skeleton } from "@/components/ui";

export default function ReadingListsLoading() {
  return (
    <div className="reading-lists">
      <PageHeader
        description="Carregando sua organização pessoal."
        eyebrow="Organização pessoal"
        title="Listas"
      />
      <div
        aria-busy="true"
        aria-label="Carregando listas"
        className="reading-list-loading"
        role="status"
      >
        <span className="sr-only">Carregando listas…</span>
        <div className="reading-list-loading__create">
          <Skeleton height="1rem" width="8rem" />
          <Skeleton height="1.75rem" width="12rem" />
          <Skeleton height="5.5rem" width="100%" />
        </div>
        <div className="reading-list-loading__grid">
          <Skeleton height="19rem" width="100%" />
          <Skeleton height="19rem" width="100%" />
        </div>
      </div>
    </div>
  );
}
