import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/features/auth/components/auth-forms";

export const metadata: Metadata = { title: "Recuperar senha | Procrastibook" };

export default function ForgotPasswordPage() {
  return (
    <section className="auth-card" aria-labelledby="forgot-password-title">
      <div className="auth-card__heading">
        <p className="auth-card__eyebrow">Recuperação de conta</p>
        <h1 id="forgot-password-title">Esqueceu sua senha?</h1>
        <p>Informe seu e-mail para receber as instruções de recuperação.</p>
      </div>

      <ForgotPasswordForm />

      <p className="auth-card__footer">
        Lembrou sua senha? <Link href="/login">Voltar para o login</Link>
      </p>
    </section>
  );
}
