export default function StatisticsLoading() {
  return (
    <div
      aria-label="Carregando estatísticas"
      className="statistics-loading"
      role="status"
    >
      <span className="statistics-loading__header" />
      <span className="statistics-loading__metrics" />
      <span className="statistics-loading__panel" />
    </div>
  );
}
