import Link from "next/link";
import type { ReactNode } from "react";

type FeedbackStateProps = Readonly<{
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
}>;

function EmptyIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm16 0A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 8v5m0 3.5v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function LoadingState({
  description = "Carregando informações…",
}: Readonly<{ description?: string }>) {
  return (
    <div aria-live="polite" className="ui-feedback-state" role="status">
      <span aria-hidden="true" className="ui-loading-state__spinner" />
      <p>{description}</p>
    </div>
  );
}

export function EmptyState({
  action,
  description,
  icon,
  title,
}: FeedbackStateProps) {
  return (
    <div className="ui-feedback-state" role="status">
      <span aria-hidden="true" className="ui-feedback-state__icon">
        {icon ?? <EmptyIcon />}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? (
        <div className="ui-feedback-state__action">{action}</div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  action,
  description,
  icon,
  retryHref,
  title,
}: FeedbackStateProps & Readonly<{ retryHref?: string }>) {
  const retryAction =
    action ??
    (retryHref ? (
      <Link
        className="ui-button ui-button--secondary ui-button--sm"
        href={retryHref}
      >
        Tentar novamente
      </Link>
    ) : null);

  return (
    <div className="ui-feedback-state ui-feedback-state--error" role="alert">
      <span aria-hidden="true" className="ui-feedback-state__icon">
        {icon ?? <ErrorIcon />}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {retryAction ? (
        <div className="ui-feedback-state__action">{retryAction}</div>
      ) : null}
    </div>
  );
}
