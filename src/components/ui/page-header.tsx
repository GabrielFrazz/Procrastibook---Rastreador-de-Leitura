import type { ReactNode } from "react";

type PageHeaderProps = Readonly<{
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
}>;

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div>
        {eyebrow ? <p className="ui-page-header__eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? (
          <p className="ui-page-header__description">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="ui-page-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
