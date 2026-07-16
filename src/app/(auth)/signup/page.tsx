import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/features/auth/components/auth-forms";
import { GoogleSignInLink } from "@/features/auth/components/google-sign-in-link";
import { isGoogleAuthEnabled } from "@/lib/config/google-auth";

export const metadata: Metadata = { title: "Criar conta | Procrastibook" };

export default function SignupPage() {
  return (
    <section className="auth-card" aria-labelledby="signup-title">
      <div className="auth-card__heading">
        <p className="auth-card__eyebrow">Sua próxima leitura começa aqui</p>
        <h1 id="signup-title">Crie sua conta</h1>
        <p>Reúna livros, mangás, artigos e e-books no seu próprio ritmo.</p>
      </div>

      <GoogleSignInLink enabled={isGoogleAuthEnabled()} nextPath="/dashboard" />
      <SignupForm />

      <p className="auth-card__footer">
        Já possui uma conta? <Link href="/login">Entrar</Link>
      </p>
    </section>
  );
}
