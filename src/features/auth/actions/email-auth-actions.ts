"use server";

import { redirect } from "next/navigation";

import {
  createAuthErrorState,
  createAuthSuccessState,
  createAuthUnavailableState,
  createValidationErrorState,
  type AuthFormState,
} from "@/features/auth/domain/auth-form-state";
import {
  validateForgotPasswordForm,
  validateLoginForm,
  validateSignupForm,
} from "@/features/auth/domain/email-auth-validation";
import { getSafeNextPath } from "@/features/auth/domain/safe-next-path";
import {
  requestPasswordRecovery,
  signInWithEmail,
  signOutCurrentSession,
  signUpWithEmail,
} from "@/features/auth/services/email-auth-service";
import { createAppUrl } from "@/lib/config/app-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function createCallbackUrl(nextPath: string) {
  const callbackUrl = new URL(createAppUrl("/auth/callback"));
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validation = validateLoginForm(formData);

  if (!validation.ok) {
    return createValidationErrorState(validation.fieldErrors);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await signInWithEmail(supabase.auth, validation.data);

    if (!result.ok) {
      return createAuthErrorState(result);
    }
  } catch {
    return createAuthUnavailableState();
  }

  const nextValue = formData.get("next");
  redirect(getSafeNextPath(typeof nextValue === "string" ? nextValue : null));
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validation = validateSignupForm(formData);

  if (!validation.ok) {
    return createValidationErrorState(validation.fieldErrors);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await signUpWithEmail(
      supabase.auth,
      validation.data,
      createCallbackUrl("/dashboard"),
    );

    if (!result.ok) {
      return createAuthErrorState(result);
    }

    return createAuthSuccessState(
      "Se o endereço puder ser cadastrado, enviaremos um link de confirmação. Verifique sua caixa de entrada.",
    );
  } catch {
    return createAuthUnavailableState();
  }
}

export async function forgotPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validation = validateForgotPasswordForm(formData);

  if (!validation.ok) {
    return createValidationErrorState(validation.fieldErrors);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await requestPasswordRecovery(
      supabase.auth,
      validation.data.email,
      createCallbackUrl("/update-password"),
    );

    if (!result.ok) {
      return createAuthErrorState(result);
    }

    return createAuthSuccessState(
      "Se existir uma conta com esse e-mail, enviaremos as instruções de recuperação.",
    );
  } catch {
    return createAuthUnavailableState();
  }
}

export async function logoutAction(): Promise<never> {
  let logoutFailed = false;

  try {
    const supabase = await createServerSupabaseClient();
    const result = await signOutCurrentSession(supabase.auth);
    logoutFailed = !result.ok;
  } catch {
    logoutFailed = true;
  }

  redirect(
    logoutFailed ? "/dashboard?authError=logout" : "/login?notice=signed-out",
  );
}
