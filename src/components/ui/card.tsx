import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> &
  Readonly<{
    as?: "article" | "div";
    children: ReactNode;
    padded?: boolean;
  }>;

export function Card({
  as: Component = "div",
  children,
  className,
  padded = true,
  ...props
}: CardProps) {
  return (
    <Component
      {...props}
      className={["ui-card", padded ? "ui-card--padded" : null, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Component>
  );
}
