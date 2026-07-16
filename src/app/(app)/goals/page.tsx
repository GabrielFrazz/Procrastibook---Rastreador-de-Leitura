import type { Metadata } from "next";

import { getCurrentProfile } from "@/features/auth/data/current-profile";
import { ReadingGoalsView } from "@/features/goals/components/reading-goals-view";
import { getReadingGoalsData } from "@/features/goals/data/reading-goals-repository";
import { getDateKeyInTimezone } from "@/features/reading/domain/reading-sessions";

export const metadata: Metadata = { title: "Metas | Procrastibook" };

export default async function GoalsPage() {
  const profile = await getCurrentProfile().catch(() => null);
  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const today = getDateKeyInTimezone(new Date(), timezone);
  const result = await getReadingGoalsData({ today, timezone })
    .then((data) => ({ data, status: "success" as const }))
    .catch(() => ({ status: "error" as const }));

  return <ReadingGoalsView result={result} today={today} />;
}
