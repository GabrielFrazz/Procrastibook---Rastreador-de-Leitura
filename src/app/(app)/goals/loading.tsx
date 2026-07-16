export default function GoalsLoading() {
  return (
    <div aria-label="Carregando metas" className="goal-loading" role="status">
      <span className="goal-loading__header" />
      <span className="goal-loading__overview" />
      <span className="goal-loading__form" />
      <span className="goal-loading__list" />
    </div>
  );
}
