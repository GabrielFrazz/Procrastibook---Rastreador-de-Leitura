import Link from "next/link";

type FeedbackStateProps = Readonly<{
  description: string;
  title: string;
}>;

export function LoadingState({
  description = "Carregando informações…",
}: Readonly<{ description?: string }>) {
  return (
    <div className="ui-feedback-state" role="status">
      <span aria-hidden="true" className="ui-loading-state__spinner" />
      <p>{description}</p>
    </div>
  );
}

export function EmptyState({ description, title }: FeedbackStateProps) {
  return (
    <div className="ui-feedback-state">
      <span aria-hidden="true" className="ui-feedback-state__icon">
        0
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function ErrorState({
  description,
  retryHref,
  title,
}: FeedbackStateProps & Readonly<{ retryHref: string }>) {
  return (
    <div className="ui-feedback-state" role="alert">
      <span aria-hidden="true" className="ui-feedback-state__icon">
        !
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link
        className="ui-button ui-button--secondary ui-button--sm"
        href={retryHref}
      >
        Tentar novamente
      </Link>
    </div>
  );
}
