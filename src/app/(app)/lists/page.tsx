import type { Metadata } from "next";

import { ReadingListsView } from "@/features/lists/components/reading-lists-view";
import { getReadingListsData } from "@/features/lists/data/reading-lists-repository";

export const metadata: Metadata = {
  title: "Listas | Procrastibook",
};

export default async function ReadingListsPage() {
  const result = await getReadingListsData()
    .then((data) => ({ data, status: "success" as const }))
    .catch(() => ({ status: "error" as const }));

  return <ReadingListsView result={result} />;
}
