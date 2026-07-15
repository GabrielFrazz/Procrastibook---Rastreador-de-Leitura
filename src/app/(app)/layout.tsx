import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/features/auth/data/current-profile";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <AppShell displayName={profile?.display_name ?? "Leitor"}>
      {children}
    </AppShell>
  );
}
