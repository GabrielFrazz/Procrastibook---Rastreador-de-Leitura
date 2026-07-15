import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { WorkDetailView } from "@/features/engagement/components/work-detail-view";
import {
  INITIAL_ENGAGEMENT_ACTION_STATE,
  type EngagementActionState,
  type WorkDetailData,
} from "@/features/engagement/domain/work-engagement";

const previewData: WorkDetailData = {
  notes: [
    {
      content:
        "Observar como as diferenças culturais moldam as decisões políticas dos personagens.",
      createdAt: "2026-07-15T18:30:00.000Z",
      id: "50000000-0000-4000-8000-000000000101",
      kind: "NOTE",
      locationLabel: "Capítulo 7",
      sessionOccurredOn: "2026-07-15",
    },
    {
      content:
        "A verdade é uma questão de imaginação: o fato mais sólido pode falhar quando a perspectiva muda.",
      createdAt: "2026-07-14T21:10:00.000Z",
      id: "50000000-0000-4000-8000-000000000102",
      kind: "QUOTE",
      locationLabel: "Página 156",
      sessionOccurredOn: null,
    },
    {
      content:
        "Retomar a discussão sobre lealdade depois de concluir a viagem para a capital.",
      createdAt: "2026-07-12T13:00:00.000Z",
      id: "50000000-0000-4000-8000-000000000103",
      kind: "NOTE",
      locationLabel: null,
      sessionOccurredOn: "2026-07-12",
    },
  ],
  review: {
    body: "Uma ficção científica paciente e profundamente humana, com construção de mundo excepcional.",
    rating: 5,
    updatedAt: "2026-07-15T20:00:00.000Z",
  },
  sessions: [
    {
      id: "40000000-0000-4000-8000-000000000101",
      occurredOn: "2026-07-15",
    },
    {
      id: "40000000-0000-4000-8000-000000000102",
      occurredOn: "2026-07-12",
    },
  ],
  work: {
    authors: ["Ursula K. Le Guin"],
    chapterCount: null,
    coverUrl: null,
    currentProgress: 184,
    description:
      "Em um planeta onde os habitantes não possuem gênero fixo, um emissário tenta construir uma aliança enquanto aprende a rever suas próprias certezas.",
    genres: ["Ficção científica", "Clássicos"],
    id: "10000000-0000-4000-8000-000000000101",
    identifiers: ["9788576572008"],
    language: "pt-BR",
    pageCount: 320,
    progressUnit: "PAGE",
    publishedYear: 1969,
    publisher: "Aleph",
    status: "READING",
    subtitle: null,
    title: "A mão esquerda da escuridão",
    type: "BOOK",
  },
};

type PreviewProps = Readonly<{
  searchParams: Promise<{
    form?: string | string[];
    state?: string | string[];
  }>;
}>;

function previewState(
  form: string,
  target: "note" | "review",
): EngagementActionState {
  if (form !== `${target}-error` && form !== `${target}-success`) {
    return INITIAL_ENGAGEMENT_ACTION_STATE;
  }

  if (form.endsWith("success")) {
    return {
      fieldErrors: {},
      message:
        target === "review"
          ? "Avaliação salva com sucesso."
          : "Anotação salva com sucesso.",
      status: "success",
    };
  }

  return {
    fieldErrors:
      target === "review"
        ? { rating: ["Escolha uma nota entre 1 e 5."] }
        : { content: ["Escreva o conteúdo antes de salvar."] },
    message:
      target === "review"
        ? "Revise a nota e o comentário antes de salvar."
        : "Revise o conteúdo antes de continuar.",
    status: "error",
  };
}

export default async function WorkDetailPreview({
  searchParams,
}: PreviewProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : "success";
  const form = typeof params.form === "string" ? params.form : "idle";
  const emptyData: WorkDetailData = {
    ...previewData,
    notes: [],
    review: null,
    sessions: [],
  };

  return (
    <AppShell displayName="Gabriel" previewPath="/library">
      <WorkDetailView
        notePreviewState={previewState(form, "note")}
        result={
          state === "error"
            ? { status: "error" }
            : {
                data: state === "empty" ? emptyData : previewData,
                status: "success",
              }
        }
        reviewPreviewState={previewState(form, "review")}
      />
    </AppShell>
  );
}
