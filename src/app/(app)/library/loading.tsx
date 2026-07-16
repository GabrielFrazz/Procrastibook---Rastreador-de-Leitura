import { Skeleton } from "@/components/ui";

function LibraryLoadingCard() {
  return (
    <article className="library-loading__card">
      <div className="library-loading__summary">
        <Skeleton
          className="library-loading__cover"
          height="8.625rem"
          variant="cover"
        />
        <div className="library-loading__copy">
          <Skeleton variant="text" width="5rem" />
          <Skeleton height="1.5rem" variant="text" width="88%" />
          <Skeleton variant="text" width="62%" />
          <Skeleton variant="text" width="7rem" />
        </div>
      </div>
      <Skeleton height="0.5625rem" width="100%" />
      <Skeleton height="2.75rem" width="100%" />
      <Skeleton height="2.75rem" width="100%" />
    </article>
  );
}

export default function LibraryLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando biblioteca"
      className="library"
      role="status"
    >
      <span className="sr-only">Carregando biblioteca…</span>

      <div aria-hidden="true" className="library-loading__header">
        <Skeleton variant="text" width="7rem" />
        <Skeleton height="2.25rem" variant="text" width="14rem" />
        <Skeleton variant="text" width="22rem" />
      </div>

      <div aria-hidden="true" className="library-loading__toolbar">
        <Skeleton height="1.5rem" variant="text" width="13rem" />
        <div className="library-loading__toolbar-fields">
          <Skeleton height="2.75rem" width="100%" />
          <Skeleton height="2.75rem" width="100%" />
          <Skeleton height="2.75rem" width="100%" />
        </div>
      </div>

      <div aria-hidden="true" className="library-loading__grid">
        {Array.from({ length: 4 }, (_, index) => (
          <LibraryLoadingCard key={index} />
        ))}
      </div>
    </div>
  );
}
