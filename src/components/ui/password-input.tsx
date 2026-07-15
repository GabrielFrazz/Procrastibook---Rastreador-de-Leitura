"use client";

import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
  Readonly<{
    hideLabel?: string;
    showLabel?: string;
  }>;

export function PasswordInput({
  className,
  hideLabel = "Ocultar senha",
  showLabel = "Mostrar senha",
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="ui-password-input">
      <input
        {...props}
        className={["ui-input", className].filter(Boolean).join(" ")}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? hideLabel : showLabel}
        className="ui-password-input__toggle"
        onClick={() => setIsVisible((visible) => !visible)}
        type="button"
      >
        {isVisible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
