import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Visão geral | Procrastibook",
};

type DashboardPageProps = Readonly<{
  searchParams: Promise<{
    authError?: string | string[];
    notice?: string | string[];
  }>;
}>;

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const authError =
    typeof params.authError === "string" ? params.authError : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;

  return (
    <div className="dashboard-placeholder">
      <PageHeader
        description="Acompanhe seu ritmo de leitura e retome suas obras sem perder o contexto."
        eyebrow="Sua leitura"
        title="Visão geral"
      />
      {authError === "logout" ? (
        <p className="auth-message auth-message--error" role="alert">
          Não foi possível encerrar a sessão. Tente novamente.
        </p>
      ) : null}
      {notice === "password-updated" ? (
        <p className="auth-message auth-message--success" role="status">
          Senha atualizada com segurança.
        </p>
      ) : null}
      <Card>
        <p className="dashboard-placeholder__message">
          O conteúdo do dashboard será implementado em uma entrega futura. O
          shell autenticado já organiza a navegação e o espaço principal da
          aplicação.
        </p>
      </Card>
    </div>
  );
}
