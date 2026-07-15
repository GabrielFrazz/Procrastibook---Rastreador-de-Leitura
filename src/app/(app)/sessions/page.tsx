import type { Metadata } from "next";

import { getCurrentProfile } from "@/features/auth/data/current-profile";
import { ReadingSessionsView } from "@/features/reading/components/reading-sessions-view";
import { getReadingSessionsData } from "@/features/reading/data/reading-sessions-repository";
import { getDateKeyInTimezone } from "@/features/reading/domain/reading-sessions";

export const metadata: Metadata = {
  title: "Sessões | Procrastibook",
};

export default async function ReadingSessionsPage() {
  const [result, profile] = await Promise.all([
    getReadingSessionsData()
      .then((data) => ({ data, status: "success" as const }))
      .catch(() => ({ status: "error" as const })),
    getCurrentProfile().catch(() => null),
  ]);
  const timezone = profile?.timezone ?? "America/Sao_Paulo";

  return (
    <ReadingSessionsView
      result={result}
      today={getDateKeyInTimezone(new Date(), timezone)}
    />
  );
}
