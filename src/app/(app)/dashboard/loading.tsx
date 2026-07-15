export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando visão geral"
      className="dashboard-loading"
      role="status"
    >
      <span className="sr-only">Carregando visão geral…</span>
      <div aria-hidden="true" className="dashboard-loading__header" />
      <div aria-hidden="true" className="dashboard-loading__metrics">
        <div className="dashboard-loading__metric" />
        <div className="dashboard-loading__metric" />
        <div className="dashboard-loading__metric" />
        <div className="dashboard-loading__metric" />
      </div>
      <div aria-hidden="true" className="dashboard-loading__panels">
        <div className="dashboard-loading__panel" />
        <div className="dashboard-loading__panel dashboard-loading__panel--small" />
      </div>
    </div>
  );
}
