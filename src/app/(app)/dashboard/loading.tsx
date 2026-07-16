import { Skeleton } from "@/components/ui/skeleton";

function LoadingWork() {
  return (
    <div className="dashboard-loading__work">
      <Skeleton height="5.625rem" variant="cover" width="3.75rem" />
      <div className="dashboard-loading__work-copy">
        <Skeleton variant="text" width="62%" />
        <Skeleton variant="text" width="28%" />
        <Skeleton height="0.5625rem" width="100%" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando visão geral"
      className="dashboard-loading"
      role="status"
    >
      <span className="sr-only">Carregando visão geral…</span>

      <div aria-hidden="true" className="dashboard-loading__header">
        <Skeleton variant="text" width="8rem" />
        <Skeleton height="2.25rem" variant="text" width="17rem" />
        <Skeleton variant="text" width="100%" />
      </div>

      <div aria-hidden="true" className="dashboard-loading__overview">
        <section className="dashboard-loading__reading">
          <Skeleton height="1.75rem" variant="text" width="11rem" />
          <LoadingWork />
          <LoadingWork />
        </section>

        <div className="dashboard-loading__metrics">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="dashboard-loading__metric" key={index}>
              <Skeleton height="2.5rem" variant="rect" width="2.5rem" />
              <Skeleton variant="text" width="6rem" />
            </div>
          ))}
        </div>

        <section className="dashboard-loading__activity">
          <Skeleton height="1.75rem" variant="text" width="10rem" />
          <Skeleton variant="text" width="72%" />
          <Skeleton variant="text" width="58%" />
          <Skeleton variant="text" width="66%" />
        </section>

        <div className="dashboard-loading__rail">
          <div className="dashboard-loading__rail-block">
            <Skeleton height="1.75rem" variant="text" width="9rem" />
            <Skeleton height="2rem" variant="text" width="6rem" />
            <Skeleton height="0.5625rem" width="100%" />
          </div>
          <div className="dashboard-loading__rail-block">
            <Skeleton height="1.75rem" variant="text" width="10rem" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="88%" />
            <Skeleton variant="text" width="94%" />
          </div>
        </div>
      </div>
    </div>
  );
}
