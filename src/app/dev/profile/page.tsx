import { notFound } from "next/navigation";

import ProfileLoading from "@/app/(app)/profile/loading";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui";
import { ProfileSettingsForm } from "@/features/profile/components/profile-settings-form";

type ProfilePreviewPageProps = Readonly<{
  searchParams: Promise<{ state?: string | string[] }>;
}>;

export default async function ProfilePreviewPage({
  searchParams,
}: ProfilePreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : "success";

  if (state === "loading") {
    return (
      <AppShell displayName="Gabriel" previewPath="/profile">
        <ProfileLoading />
      </AppShell>
    );
  }

  return (
    <AppShell displayName="Gabriel" previewPath="/profile">
      <div className="profile-settings-page">
        <PageHeader
          description="Atualize como seu perfil e suas datas aparecem no Procrastibook."
          eyebrow="Sua conta"
          title="Perfil"
        />
        <ProfileSettingsForm
          profile={{
            avatarPath: null,
            avatarUrl: null,
            displayName: "Gabriel",
            email: "gabriel@example.com",
            id: "50000000-0000-4000-8000-000000000001",
            timezone: "America/Sao_Paulo",
          }}
        />
      </div>
    </AppShell>
  );
}
