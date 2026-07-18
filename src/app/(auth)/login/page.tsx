import type { Metadata } from "next";
import Link from "next/link";

import { FormStatusMessage } from "@/components/ui";
import { LoginForm } from "@/features/auth/components/auth-forms";
import { GoogleSignInLink } from "@/features/auth/components/google-sign-in-link";
import { getLoginFeedback } from "@/features/auth/domain/auth-feedback";
import { getSafeNextPath } from "@/features/auth/domain/safe-next-path";
import { isGoogleAuthEnabled } from "@/lib/config/google-auth";

export const metadata: Metadata = { title: "Entrar | Procrastibook" };

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    next?: string | string[];
    notice?: string | string[];
    error?: string | string[];
  }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = typeof params.next === "string" ? params.next : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const feedback = getLoginFeedback(notice, error);
  const nextPath = getSafeNextPath(nextValue);

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <div className="auth-card__heading">
        <p className="auth-card__eyebrow">Que bom ter você aqui</p>
        <h1 id="login-title">Volte para sua estante</h1>
        <p>Entre para continuar de onde parou.</p>
      </div>

      {feedback ? (
        <FormStatusMessage message={feedback.message} status={feedback.kind} />
      ) : null}

      <LoginForm nextPath={nextPath} />
      <GoogleSignInLink
        dividerPlacement="before"
        enabled={isGoogleAuthEnabled()}
        nextPath={nextPath}
      />

      <p className="auth-card__footer">
        Não tem uma conta? <Link href="/signup">Cadastre-se</Link>
      </p>
    </section>
  );
}
