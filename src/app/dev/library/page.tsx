import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { LibraryView } from "@/features/library/components/library-view";
import type { LibraryWork } from "@/features/library/domain/library-catalog";

const previewWorks: LibraryWork[] = [
  {
    authors: ["Ursula K. Le Guin"],
    coverUrl: null,
    currentProgress: 184,
    genres: ["Ficção científica", "Clássicos"],
    id: "preview-library-1",
    progressPercent: 57.5,
    progressUnit: "PAGE",
    rating: 4.5,
    status: "READING",
    subtitle: null,
    title: "A mão esquerda da escuridão",
    totalProgress: 320,
    type: "BOOK",
    updatedAt: "2026-07-15T12:00:00.000Z",
  },
  {
    authors: ["George Orwell"],
    coverUrl: null,
    currentProgress: 0,
    genres: ["Distopia"],
    id: "preview-library-2",
    progressPercent: 0,
    progressUnit: "PAGE",
    rating: null,
    status: "WANT_TO_READ",
    subtitle: null,
    title: "1984",
    totalProgress: 328,
    type: "EBOOK",
    updatedAt: "2026-07-14T12:00:00.000Z",
  },
  {
    authors: ["Antoine de Saint-Exupéry"],
    coverUrl: null,
    currentProgress: 96,
    genres: ["Fábula", "Clássicos"],
    id: "preview-library-3",
    progressPercent: 100,
    progressUnit: "PAGE",
    rating: 5,
    status: "FINISHED",
    subtitle: null,
    title: "O pequeno príncipe",
    totalProgress: 96,
    type: "BOOK",
    updatedAt: "2026-07-13T12:00:00.000Z",
  },
  {
    authors: ["Hiromu Arakawa"],
    coverUrl: null,
    currentProgress: 18,
    genres: ["Aventura", "Fantasia"],
    id: "preview-library-4",
    progressPercent: 66.7,
    progressUnit: "CHAPTER",
    rating: 4.8,
    status: "READING",
    subtitle: "Edição especial",
    title: "Fullmetal Alchemist",
    totalProgress: 27,
    type: "MANGA",
    updatedAt: "2026-07-12T12:00:00.000Z",
  },
  {
    authors: ["Don Norman"],
    coverUrl: null,
    currentProgress: 73,
    genres: ["Design"],
    id: "preview-library-5",
    progressPercent: 20.9,
    progressUnit: "PAGE",
    rating: 4,
    status: "READING",
    subtitle: "Psicologia dos objetos do cotidiano",
    title: "O design do dia a dia",
    totalProgress: 349,
    type: "BOOK",
    updatedAt: "2026-07-11T12:00:00.000Z",
  },
  {
    authors: [
      "Autora com um nome propositalmente extenso para testar o cartão",
    ],
    coverUrl: null,
    currentProgress: 42,
    genres: ["Tecnologia"],
    id: "preview-library-6",
    progressPercent: 42,
    progressUnit: "PERCENT",
    rating: null,
    status: "ABANDONED",
    subtitle: "Uma referência de conteúdo longo",
    title:
      "Interfaces para quem lê: um título longo o bastante para ocupar mais de uma linha",
    totalProgress: 100,
    type: "ARTICLE",
    updatedAt: "2026-07-10T12:00:00.000Z",
  },
  {
    authors: [],
    coverUrl: null,
    currentProgress: 18,
    genres: [],
    id: "preview-library-7",
    progressPercent: null,
    progressUnit: "PAGE",
    rating: null,
    status: "READING",
    subtitle: null,
    title: "Obra sem total conhecido",
    totalProgress: null,
    type: "EBOOK",
    updatedAt: "2026-07-09T12:00:00.000Z",
  },
];

type LibraryPreviewPageProps = Readonly<{
  searchParams: Promise<{ state?: string | string[] }>;
}>;

export default async function LibraryPreviewPage({
  searchParams,
}: LibraryPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : undefined;

  return (
    <AppShell displayName="Gabriel" previewPath="/library">
      <LibraryView
        result={
          state === "error"
            ? { status: "error" }
            : {
                status: "success",
                works: state === "empty" ? [] : previewWorks,
              }
        }
      />
    </AppShell>
  );
}
