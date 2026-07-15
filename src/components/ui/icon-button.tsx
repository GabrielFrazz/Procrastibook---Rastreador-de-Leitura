import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> &
  Readonly<{
    label: string;
    children: ReactNode;
  }>;

export function IconButton({
  children,
  className,
  label,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      className={["ui-icon-button", className].filter(Boolean).join(" ")}
      type={type}
    >
      {children}
    </button>
  );
}
