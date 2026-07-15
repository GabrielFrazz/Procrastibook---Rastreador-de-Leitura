import { LoadingState } from "@/components/ui";

export default function WorkDetailLoading() {
  return (
    <div className="work-detail-page">
      <span className="work-detail-back">← Voltar à biblioteca</span>
      <LoadingState description="Carregando detalhes da obra…" />
    </div>
  );
}
