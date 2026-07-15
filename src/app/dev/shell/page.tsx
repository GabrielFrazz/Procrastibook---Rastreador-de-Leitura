import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function ShellPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <AppShell displayName="Gabriel" previewPath="/dashboard">
      <div className="dashboard-placeholder">
        <PageHeader
          description="Acompanhe seu ritmo de leitura e retome suas obras sem perder o contexto."
          eyebrow="Sua leitura"
          title="Visão geral"
        />
        <Card>
          <p className="dashboard-placeholder__message">
            O conteúdo do dashboard será implementado em uma entrega futura.
            Neste momento, esta área permite validar a navegação e o
            comportamento responsivo do aplicativo.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
