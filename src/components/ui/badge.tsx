import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "neutral" | "strong" | "success" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  Readonly<{
    children: ReactNode;
    tone?: BadgeTone;
  }>;

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={["ui-badge", `ui-badge--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
