import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getProfileSettingsData } from "@/features/profile/data/profile-settings-repository";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfileSettingsData();

  return (
    <AppShell
      avatarUrl={profile?.avatarUrl ?? null}
      displayName={profile?.displayName ?? "Leitor"}
      email={profile?.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
