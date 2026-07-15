import type { Metadata } from "next";

import { logoutAction } from "@/features/auth/actions/email-auth-actions";
import { getCurrentProfile } from "@/features/auth/data/current-profile";

export const metadata: Metadata = {
  title: "Área autenticada | Procrastibook",
};

type DashboardPageProps = Readonly<{
  searchParams: Promise<{ authError?: string | string[] }>;
}>;

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const [profile, params] = await Promise.all([
    getCurrentProfile(),
    searchParams,
  ]);
  const authError =
    typeof params.authError === "string" ? params.authError : undefined;

  return (
    <main className="authenticated-placeholder">
      <section aria-labelledby="authenticated-title">
        <p className="workspace__eyebrow">Área autenticada</p>
        <h1 id="authenticated-title">
          Olá, {profile?.display_name ?? "leitor"}.
        </h1>
        <p>
          Sua sessão está ativa. O dashboard completo será implementado em uma
          entrega própria.
        </p>
        {authError === "logout" ? (
          <p className="auth-message auth-message--error" role="alert">
            Não foi possível encerrar a sessão. Tente novamente.
          </p>
        ) : null}
        <form action={logoutAction}>
          <button className="secondary-action" type="submit">
            Sair
          </button>
        </form>
      </section>
    </main>
  );
}
