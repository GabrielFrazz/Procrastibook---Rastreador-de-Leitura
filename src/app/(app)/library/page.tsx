import type { Metadata } from "next";

import { LibraryView } from "@/features/library/components/library-view";
import { getLibraryWorks } from "@/features/library/data/library-repository";

export const metadata: Metadata = {
  title: "Biblioteca | Procrastibook",
};

export default async function LibraryPage() {
  const result = await getLibraryWorks()
    .then((works) => ({ status: "success" as const, works }))
    .catch(() => ({ status: "error" as const }));

  return <LibraryView result={result} />;
}
