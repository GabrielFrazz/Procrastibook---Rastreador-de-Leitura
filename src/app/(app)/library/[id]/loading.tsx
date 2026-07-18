import { Skeleton } from "@/components/ui";

export default function WorkDetailLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando detalhes da obra"
      className="work-detail-page"
      role="status"
    >
      <span className="sr-only">Carregando detalhes da obra…</span>
      <span className="work-detail-back">← Voltar à biblioteca</span>

      <div className="work-detail-loading-overview">
        <div className="work-detail-loading-cover">
          <Skeleton variant="cover" />
        </div>
        <div className="work-detail-loading-content">
          <Skeleton height="1.5rem" width="9rem" />
          <Skeleton height="2.5rem" width="min(100%, 32rem)" />
          <Skeleton height="1rem" width="13rem" />
          <Skeleton height="4.5rem" width="100%" />
          <div className="work-detail-loading-meta">
            <Skeleton height="3.75rem" width="100%" />
            <Skeleton height="3.75rem" width="100%" />
          </div>
          <Skeleton height="5rem" width="100%" />
        </div>
      </div>

      <div className="work-detail-loading-panels">
        <div className="work-detail-loading-panel">
          <Skeleton height="1rem" width="8rem" />
          <Skeleton height="1.75rem" width="12rem" />
          <Skeleton height="2.75rem" width="100%" />
          <Skeleton height="7rem" width="100%" />
        </div>
        <div className="work-detail-loading-panel">
          <Skeleton height="1rem" width="9rem" />
          <Skeleton height="1.75rem" width="13rem" />
          <Skeleton height="2.75rem" width="100%" />
          <Skeleton height="7rem" width="100%" />
        </div>
      </div>
    </div>
  );
}
