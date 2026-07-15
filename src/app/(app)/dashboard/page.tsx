import type { Metadata } from "next";

import { getCurrentProfile } from "@/features/auth/data/current-profile";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getDashboardSummary } from "@/features/dashboard/data/dashboard-repository";

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
  const [params, profile] = await Promise.all([
    searchParams,
    getCurrentProfile(),
  ]);
  const authError =
    typeof params.authError === "string" ? params.authError : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const timezone = profile?.timezone ?? "America/Sao_Paulo";

  const result = await getDashboardSummary(timezone)
    .then((summary) => ({ status: "success" as const, summary }))
    .catch(() => ({ status: "error" as const }));

  return (
    <DashboardView
      result={result}
      timezone={timezone}
      {...(authError ? { authError } : {})}
      {...(notice ? { notice } : {})}
    />
  );
}
