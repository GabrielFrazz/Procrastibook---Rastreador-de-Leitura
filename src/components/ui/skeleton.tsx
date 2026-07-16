import type { CSSProperties, HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLSpanElement> &
  Readonly<{
    height?: CSSProperties["height"];
    variant?: "text" | "rect" | "circle" | "cover";
    width?: CSSProperties["width"];
  }>;

export function Skeleton({
  className,
  height,
  style,
  variant = "rect",
  width,
  ...props
}: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={["ui-skeleton", `ui-skeleton--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...style, height, width }}
    />
  );
}
