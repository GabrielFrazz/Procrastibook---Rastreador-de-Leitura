import { Skeleton } from "@/components/ui";

export default function StatisticsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando estatísticas"
      className="statistics-loading"
      role="status"
    >
      <span className="sr-only">Carregando estatísticas…</span>
      <Skeleton className="statistics-loading__header" />
      <div className="statistics-loading__metrics">
        <Skeleton height="5.5rem" width="100%" />
        <Skeleton height="5.5rem" width="100%" />
        <Skeleton height="5.5rem" width="100%" />
        <Skeleton height="5.5rem" width="100%" />
      </div>
      <div className="statistics-loading__layout">
        <Skeleton height="28rem" width="100%" />
        <Skeleton height="18rem" width="100%" />
      </div>
    </div>
  );
}
