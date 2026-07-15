import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return [
    "ui-button",
    `ui-button--${variant}`,
    size === "md" ? null : `ui-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Readonly<{
    children: ReactNode;
    isLoading?: boolean;
    size?: ButtonSize;
    variant?: ButtonVariant;
  }>;

export function Button({
  children,
  className,
  disabled,
  isLoading = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={isLoading || undefined}
      className={getButtonClassName(variant, size, className)}
      disabled={disabled || isLoading}
      type={type}
    >
      {isLoading ? (
        <span aria-hidden="true" className="ui-button__spinner" />
      ) : null}
      {children}
    </button>
  );
}
