export type AuthField =
  "displayName" | "email" | "password" | "passwordConfirmation";

export type AuthFieldErrors = Partial<Record<AuthField, readonly string[]>>;

export type ValidationResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; fieldErrors: AuthFieldErrors }>;

export type LoginInput = Readonly<{ email: string; password: string }>;
export type SignupInput = Readonly<{
  displayName: string;
  email: string;
  password: string;
}>;
export type ForgotPasswordInput = Readonly<{ email: string }>;
export type UpdatePasswordInput = Readonly<{ password: string }>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

function readText(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
}

function addError(
  errors: Partial<Record<AuthField, string[]>>,
  field: AuthField,
  message: string,
) {
  const fieldErrors = errors[field] ?? [];
  fieldErrors.push(message);
  errors[field] = fieldErrors;
}

function validateEmail(
  email: string,
  errors: Partial<Record<AuthField, string[]>>,
) {
  if (!email) {
    addError(errors, "email", "Informe seu e-mail.");
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    addError(errors, "email", "Informe um e-mail válido.");
  }
}

function hasErrors(errors: Partial<Record<AuthField, string[]>>) {
  return Object.keys(errors).length > 0;
}

export function validateLoginForm(
  formData: FormData,
): ValidationResult<LoginInput> {
  const email = readText(formData, "email").trim().toLowerCase();
  const password = readText(formData, "password");
  const errors: Partial<Record<AuthField, string[]>> = {};

  validateEmail(email, errors);
  if (!password) {
    addError(errors, "password", "Informe sua senha.");
  } else if (password.length > 128) {
    addError(errors, "password", "A senha deve ter no máximo 128 caracteres.");
  }

  return hasErrors(errors)
    ? { ok: false, fieldErrors: errors }
    : { ok: true, data: { email, password } };
}

export function validateSignupForm(
  formData: FormData,
): ValidationResult<SignupInput> {
  const displayName = readText(formData, "displayName")
    .trim()
    .replace(/\s+/g, " ");
  const email = readText(formData, "email").trim().toLowerCase();
  const password = readText(formData, "password");
  const passwordConfirmation = readText(formData, "passwordConfirmation");
  const errors: Partial<Record<AuthField, string[]>> = {};

  if (displayName.length < 2) {
    addError(
      errors,
      "displayName",
      "Informe um nome com pelo menos 2 caracteres.",
    );
  } else if (displayName.length > 80) {
    addError(errors, "displayName", "O nome deve ter no máximo 80 caracteres.");
  } else if (CONTROL_CHARACTER_PATTERN.test(displayName)) {
    addError(errors, "displayName", "O nome contém caracteres inválidos.");
  }

  validateEmail(email, errors);
  if (password.length < 8) {
    addError(errors, "password", "Use pelo menos 8 caracteres.");
  } else if (password.length > 128) {
    addError(errors, "password", "A senha deve ter no máximo 128 caracteres.");
  }

  if (!passwordConfirmation) {
    addError(errors, "passwordConfirmation", "Confirme sua senha.");
  } else if (password !== passwordConfirmation) {
    addError(errors, "passwordConfirmation", "As senhas não coincidem.");
  }

  return hasErrors(errors)
    ? { ok: false, fieldErrors: errors }
    : { ok: true, data: { displayName, email, password } };
}

export function validateForgotPasswordForm(
  formData: FormData,
): ValidationResult<ForgotPasswordInput> {
  const email = readText(formData, "email").trim().toLowerCase();
  const errors: Partial<Record<AuthField, string[]>> = {};
  validateEmail(email, errors);

  return hasErrors(errors)
    ? { ok: false, fieldErrors: errors }
    : { ok: true, data: { email } };
}

export function validateUpdatePasswordForm(
  formData: FormData,
): ValidationResult<UpdatePasswordInput> {
  const password = readText(formData, "password");
  const passwordConfirmation = readText(formData, "passwordConfirmation");
  const errors: Partial<Record<AuthField, string[]>> = {};

  if (password.length < 8) {
    addError(errors, "password", "Use pelo menos 8 caracteres.");
  } else if (password.length > 128) {
    addError(errors, "password", "A senha deve ter no máximo 128 caracteres.");
  }

  if (!passwordConfirmation) {
    addError(errors, "passwordConfirmation", "Confirme sua senha.");
  } else if (password !== passwordConfirmation) {
    addError(errors, "passwordConfirmation", "As senhas não coincidem.");
  }

  return hasErrors(errors)
    ? { ok: false, fieldErrors: errors }
    : { ok: true, data: { password } };
}
