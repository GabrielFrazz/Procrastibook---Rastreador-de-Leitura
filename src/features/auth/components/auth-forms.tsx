"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  forgotPasswordAction,
  loginAction,
  signupAction,
  updatePasswordAction,
} from "@/features/auth/actions/email-auth-actions";
import {
  INITIAL_AUTH_FORM_STATE,
  type AuthFormState,
} from "@/features/auth/domain/auth-form-state";
import type { AuthField } from "@/features/auth/domain/email-auth-validation";

type FieldErrorProps = Readonly<{
  field: AuthField;
  state: AuthFormState;
}>;

function FieldError({ field, state }: FieldErrorProps) {
  const errors = state.fieldErrors[field];

  if (!errors?.length) {
    return null;
  }

  return (
    <div className="auth-field__error" id={`${field}-error`} role="alert">
      {errors.map((error) => (
        <span key={error}>{error}</span>
      ))}
    </div>
  );
}

function FormMessage({ state }: Readonly<{ state: AuthFormState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`auth-message auth-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({ idleLabel }: Readonly<{ idleLabel: string }>) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" disabled={pending} type="submit">
      {pending ? "Aguarde…" : idleLabel}
    </button>
  );
}

type PasswordFieldProps = Readonly<{
  autoComplete: "current-password" | "new-password";
  field: "password" | "passwordConfirmation";
  label: string;
  labelAction?: ReactNode;
  placeholder: string;
  state: AuthFormState;
}>;

function PasswordField({
  autoComplete,
  field,
  label,
  labelAction,
  placeholder,
  state,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hasError = Boolean(state.fieldErrors[field]?.length);

  return (
    <div className="auth-field">
      <div className="auth-field__heading">
        <label htmlFor={field}>{label}</label>
        {labelAction}
      </div>
      <div className="auth-password">
        <input
          aria-describedby={hasError ? `${field}-error` : undefined}
          aria-invalid={hasError}
          autoComplete={autoComplete}
          id={field}
          maxLength={128}
          minLength={autoComplete === "new-password" ? 8 : undefined}
          name={field}
          placeholder={placeholder}
          required
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-label={
            isVisible
              ? `Ocultar ${label.toLowerCase()}`
              : `Mostrar ${label.toLowerCase()}`
          }
          className="auth-password__toggle"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <FieldError field={field} state={state} />
    </div>
  );
}

export function LoginForm({ nextPath }: Readonly<{ nextPath: string }>) {
  const [state, formAction] = useActionState(
    loginAction,
    INITIAL_AUTH_FORM_STATE,
  );
  const hasEmailError = Boolean(state.fieldErrors.email?.length);

  return (
    <form action={formAction} className="auth-form">
      <input name="next" type="hidden" value={nextPath} />
      <FormMessage state={state} />

      <div className="auth-field">
        <label htmlFor="email">E-mail</label>
        <input
          aria-describedby={hasEmailError ? "email-error" : undefined}
          aria-invalid={hasEmailError}
          autoComplete="email"
          id="email"
          inputMode="email"
          maxLength={254}
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />
        <FieldError field="email" state={state} />
      </div>

      <PasswordField
        autoComplete="current-password"
        field="password"
        label="Senha"
        labelAction={<Link href="/forgot-password">Esqueci minha senha</Link>}
        placeholder="Digite sua senha"
        state={state}
      />

      <SubmitButton idleLabel="Entrar" />
    </form>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(
    signupAction,
    INITIAL_AUTH_FORM_STATE,
  );
  const hasNameError = Boolean(state.fieldErrors.displayName?.length);
  const hasEmailError = Boolean(state.fieldErrors.email?.length);

  return (
    <form action={formAction} className="auth-form">
      <FormMessage state={state} />

      <div className="auth-field">
        <label htmlFor="displayName">Nome</label>
        <input
          aria-describedby={hasNameError ? "displayName-error" : undefined}
          aria-invalid={hasNameError}
          autoComplete="name"
          id="displayName"
          maxLength={80}
          minLength={2}
          name="displayName"
          placeholder="Como você quer ser chamado?"
          required
          type="text"
        />
        <FieldError field="displayName" state={state} />
      </div>

      <div className="auth-field">
        <label htmlFor="email">E-mail</label>
        <input
          aria-describedby={hasEmailError ? "email-error" : undefined}
          aria-invalid={hasEmailError}
          autoComplete="email"
          id="email"
          inputMode="email"
          maxLength={254}
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />
        <FieldError field="email" state={state} />
      </div>

      <PasswordField
        autoComplete="new-password"
        field="password"
        label="Senha"
        placeholder="Crie uma senha segura"
        state={state}
      />
      <p className="auth-form__hint">Use pelo menos 8 caracteres.</p>
      <PasswordField
        autoComplete="new-password"
        field="passwordConfirmation"
        label="Confirmar senha"
        placeholder="Repita a senha criada"
        state={state}
      />

      <SubmitButton idleLabel="Criar conta" />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    INITIAL_AUTH_FORM_STATE,
  );
  const hasEmailError = Boolean(state.fieldErrors.email?.length);

  return (
    <form action={formAction} className="auth-form">
      <FormMessage state={state} />

      <div className="auth-field">
        <label htmlFor="email">E-mail</label>
        <input
          aria-describedby={hasEmailError ? "email-error" : undefined}
          aria-invalid={hasEmailError}
          autoComplete="email"
          id="email"
          inputMode="email"
          maxLength={254}
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />
        <FieldError field="email" state={state} />
      </div>

      <SubmitButton idleLabel="Enviar instruções" />
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction,
    INITIAL_AUTH_FORM_STATE,
  );

  return (
    <form action={formAction} className="auth-form">
      <FormMessage state={state} />

      <PasswordField
        autoComplete="new-password"
        field="password"
        label="Nova senha"
        placeholder="Crie uma nova senha segura"
        state={state}
      />
      <p className="auth-form__hint">Use pelo menos 8 caracteres.</p>
      <PasswordField
        autoComplete="new-password"
        field="passwordConfirmation"
        label="Confirmar nova senha"
        placeholder="Repita a nova senha"
        state={state}
      />

      <SubmitButton idleLabel="Atualizar senha" />
    </form>
  );
}
