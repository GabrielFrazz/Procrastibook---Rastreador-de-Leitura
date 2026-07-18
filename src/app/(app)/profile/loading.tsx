import { PageHeader, Skeleton } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando perfil"
      className="profile-settings-page"
      role="status"
    >
      <span className="sr-only">Carregando perfil…</span>
      <PageHeader
        description="Atualize como seu perfil e suas datas aparecem no Procrastibook."
        eyebrow="Sua conta"
        title="Perfil"
      />
      <div className="profile-loading">
        <Skeleton height="7rem" width="7rem" variant="circle" />
        <div>
          <Skeleton height="1.5rem" width="14rem" />
          <Skeleton height="2.75rem" width="100%" />
          <Skeleton height="2.75rem" width="100%" />
        </div>
      </div>
    </div>
  );
}
