import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import type { NormalizedWorkCandidate } from "@/features/catalog/domain/catalog-provider";
import { AddWorkView } from "@/features/works/components/add-work-view";
import {
  createWorkErrorState,
  INITIAL_WORK_FORM_STATE,
} from "@/features/works/domain/work-form";

type AddWorkPreviewPageProps = Readonly<{
  searchParams: Promise<{ state?: string | string[] }>;
}>;

const previewCandidates = [
  {
    authors: ["Machado de Assis"],
    coverUrl: null,
    description:
      "Um clássico brasileiro narrado por Bento Santiago sobre memória, ciúme e dúvida.",
    externalId: "preview-dom-casmurro",
    genres: ["Literatura brasileira", "Clássico"],
    infoUrl: null,
    isbn10: null,
    isbn13: "9788535902775",
    language: "pt-BR",
    pageCount: 256,
    provider: "GOOGLE_BOOKS",
    publishedYear: 1899,
    publisher: "Companhia das Letras",
    subtitle: null,
    suggestedType: "BOOK",
    title: "Dom Casmurro",
  },
  {
    authors: ["Conceição Evaristo"],
    coverUrl: null,
    description: null,
    externalId: "/works/OL-PREVIEW-W",
    genres: ["Contos", "Literatura brasileira"],
    infoUrl: null,
    isbn10: null,
    isbn13: "9788534705554",
    language: "pt-BR",
    pageCount: 116,
    provider: "OPEN_LIBRARY",
    publishedYear: 2014,
    publisher: "Pallas",
    subtitle: null,
    suggestedType: "BOOK",
    title: "Olhos d'água",
  },
] satisfies readonly NormalizedWorkCandidate[];

export default async function AddWorkPreviewPage({
  searchParams,
}: AddWorkPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : undefined;
  const initialState =
    state === "error"
      ? createWorkErrorState(
          "Revise os campos destacados antes de continuar.",
          {
            authors: ["Informe entre um e oito autores."],
            cover: ["Use uma imagem JPEG, PNG ou WebP."],
            title: ["Informe um título com até 200 caracteres."],
          },
        )
      : INITIAL_WORK_FORM_STATE;

  return (
    <AppShell displayName="Gabriel" previewPath="/library/new">
      <AddWorkView
        initialCatalogCandidates={previewCandidates}
        initialState={initialState}
      />
    </AppShell>
  );
}
