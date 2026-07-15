import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ReadingListsView } from "@/features/lists/components/reading-lists-view";
import type { ReadingListsData } from "@/features/lists/domain/reading-lists";

const previewData: ReadingListsData = {
  lists: [
    {
      description: "Obras curtas para levar durante a viagem.",
      id: "30000000-0000-4000-8000-000000000001",
      items: [
        {
          authors: ["Conceição Evaristo"],
          id: "10000000-0000-4000-8000-000000000001",
          status: "WANT_TO_READ",
          title: "Olhos d'água",
          type: "BOOK",
        },
        {
          authors: ["Antoine de Saint-Exupéry"],
          id: "10000000-0000-4000-8000-000000000002",
          status: "FINISHED",
          title: "O pequeno príncipe",
          type: "EBOOK",
        },
      ],
      name: "Leituras para as férias",
      updatedAt: "2026-07-15T12:00:00.000Z",
    },
    {
      description: null,
      id: "30000000-0000-4000-8000-000000000002",
      items: [],
      name: "Clássicos para conhecer",
      updatedAt: "2026-07-14T12:00:00.000Z",
    },
  ],
  works: [
    {
      authors: ["Conceição Evaristo"],
      id: "10000000-0000-4000-8000-000000000001",
      status: "WANT_TO_READ",
      title: "Olhos d'água",
      type: "BOOK",
    },
    {
      authors: ["Antoine de Saint-Exupéry"],
      id: "10000000-0000-4000-8000-000000000002",
      status: "FINISHED",
      title: "O pequeno príncipe",
      type: "EBOOK",
    },
    {
      authors: ["Ursula K. Le Guin"],
      id: "10000000-0000-4000-8000-000000000003",
      status: "READING",
      title: "A mão esquerda da escuridão",
      type: "BOOK",
    },
    {
      authors: ["Hiromu Arakawa"],
      id: "10000000-0000-4000-8000-000000000004",
      status: "READING",
      title: "Fullmetal Alchemist — edição especial",
      type: "MANGA",
    },
  ],
};

type ListsPreviewPageProps = Readonly<{
  searchParams: Promise<{ state?: string | string[] }>;
}>;

export default async function ListsPreviewPage({
  searchParams,
}: ListsPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : undefined;

  return (
    <AppShell displayName="Gabriel" previewPath="/lists">
      <ReadingListsView
        result={
          state === "error"
            ? { status: "error" }
            : {
                data:
                  state === "empty"
                    ? { lists: [], works: previewData.works }
                    : previewData,
                status: "success",
              }
        }
      />
    </AppShell>
  );
}
