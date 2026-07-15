import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/features/auth/components/auth-forms";
import { getSafeNextPath } from "@/features/auth/domain/safe-next-path";

export const metadata: Metadata = { title: "Entrar | Procrastibook" };

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    next?: string | string[];
    notice?: string | string[];
  }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = typeof params.next === "string" ? params.next : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <div className="auth-card__heading">
        <p className="auth-card__eyebrow">Bem-vindo de volta</p>
        <h1 id="login-title">Entre na sua conta</h1>
        <p>Continue acompanhando suas leituras de onde parou.</p>
      </div>

      {notice === "signed-out" ? (
        <p className="auth-message auth-message--success" role="status">
          Sessão encerrada com segurança.
        </p>
      ) : null}

      <LoginForm nextPath={getSafeNextPath(nextValue)} />

      <p className="auth-card__footer">
        Ainda não tem uma conta? <Link href="/signup">Criar conta</Link>
      </p>
    </section>
  );
}
