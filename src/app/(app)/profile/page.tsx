import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui";
import { ProfileSettingsForm } from "@/features/profile/components/profile-settings-form";
import { getProfileSettingsData } from "@/features/profile/data/profile-settings-repository";

export const metadata: Metadata = {
  title: "Perfil | Procrastibook",
};

export default async function ProfilePage() {
  const profile = await getProfileSettingsData();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="profile-settings-page">
      <PageHeader
        description="Atualize como seu perfil e suas datas aparecem no Procrastibook."
        eyebrow="Sua conta"
        title="Perfil"
      />
      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
