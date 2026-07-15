import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FormFieldProps = Readonly<{
  children: ReactNode;
  error?: string;
  hint?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
}>;

export function FormField({
  children,
  error,
  hint,
  htmlFor,
  label,
  required = false,
}: FormFieldProps) {
  return (
    <div className="ui-form-field">
      <label className="ui-form-field__label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ui-form-field__required">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          className="ui-form-field__error"
          id={`${htmlFor}-error`}
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="ui-form-field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={["ui-input", className].filter(Boolean).join(" ")}
    />
  );
}

export function Select({
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={["ui-select", className].filter(Boolean).join(" ")}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={["ui-textarea", className].filter(Boolean).join(" ")}
    />
  );
}
