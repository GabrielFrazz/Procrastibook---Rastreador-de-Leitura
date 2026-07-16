import type { Metadata } from "next";

import { getCurrentProfile } from "@/features/auth/data/current-profile";
import { ReadingStatisticsView } from "@/features/statistics/components/reading-statistics-view";
import { getReadingStatistics } from "@/features/statistics/data/reading-statistics-repository";

export const metadata: Metadata = { title: "Estatísticas | Procrastibook" };

export default async function StatisticsPage() {
  const profile = await getCurrentProfile().catch(() => null);
  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const result = await getReadingStatistics({ timezone })
    .then((data) => ({ data, status: "success" as const }))
    .catch(() => ({ status: "error" as const }));

  return <ReadingStatisticsView result={result} />;
}
