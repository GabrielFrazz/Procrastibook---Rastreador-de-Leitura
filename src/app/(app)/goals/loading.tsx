import { Skeleton } from "@/components/ui";

export default function GoalsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando metas"
      className="goal-loading"
      role="status"
    >
      <span className="sr-only">Carregando metas…</span>
      <Skeleton className="goal-loading__header" />
      <div className="goal-loading__overview">
        <Skeleton height="5rem" width="100%" />
        <Skeleton height="5rem" width="100%" />
        <Skeleton height="5rem" width="100%" />
      </div>
      <Skeleton className="goal-loading__form" />
      <div className="goal-loading__list">
        <Skeleton height="16rem" width="100%" />
        <Skeleton height="16rem" width="100%" />
      </div>
    </div>
  );
}
