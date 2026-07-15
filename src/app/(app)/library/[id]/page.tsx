import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkDetailView } from "@/features/engagement/components/work-detail-view";
import { getWorkDetailData } from "@/features/engagement/data/work-detail-repository";

export const metadata: Metadata = {
  title: "Detalhes da obra | Procrastibook",
};

type WorkDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { id } = await params;
  const result = await getWorkDetailData(id)
    .then((data) => (data ? { data, status: "success" as const } : null))
    .catch(() => ({ status: "error" as const }));

  if (result === null) {
    notFound();
  }

  return <WorkDetailView result={result} />;
}
