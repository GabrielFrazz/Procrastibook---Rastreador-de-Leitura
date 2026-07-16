import type { Metadata } from "next";

import { getCurrentProfile } from "@/features/auth/data/current-profile";
import { LibraryView } from "@/features/library/components/library-view";
import { getLibraryWorks } from "@/features/library/data/library-repository";

export const metadata: Metadata = {
  title: "Biblioteca | Procrastibook",
};

type LibraryPageProps = Readonly<{
  searchParams: Promise<{
    notice?: string | string[];
    q?: string | string[];
    status?: string | string[];
  }>;
}>;

const validStatuses = [
  "WANT_TO_READ",
  "READING",
  "FINISHED",
  "ABANDONED",
] as const;

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const query = typeof params.q === "string" ? params.q.slice(0, 200) : "";
  const requestedStatus =
    typeof params.status === "string" ? params.status : "";
  const initialStatus = validStatuses.includes(
    requestedStatus as (typeof validStatuses)[number],
  )
    ? (requestedStatus as (typeof validStatuses)[number])
    : "ALL";
  const [result, profile] = await Promise.all([
    getLibraryWorks()
      .then((works) => ({ status: "success" as const, works }))
      .catch(() => ({ status: "error" as const })),
    getCurrentProfile().catch(() => null),
  ]);

  return (
    <LibraryView
      key={`${query}:${initialStatus}`}
      initialQuery={query}
      initialStatus={initialStatus}
      result={result}
      timezone={profile?.timezone ?? "America/Sao_Paulo"}
      {...(notice ? { notice } : {})}
    />
  );
}
