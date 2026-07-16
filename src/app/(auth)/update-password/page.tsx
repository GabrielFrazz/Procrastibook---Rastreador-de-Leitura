import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/features/auth/components/auth-forms";

export const metadata: Metadata = {
  title: "Definir nova senha | Procrastibook",
};

export default function UpdatePasswordPage() {
  return (
    <section className="auth-card" aria-labelledby="update-password-title">
      <div className="auth-card__heading">
        <p className="auth-card__eyebrow">Um novo começo</p>
        <h1 id="update-password-title">Defina uma nova senha</h1>
        <p>Escolha uma senha diferente, com pelo menos 8 caracteres.</p>
      </div>

      <UpdatePasswordForm />
    </section>
  );
}
