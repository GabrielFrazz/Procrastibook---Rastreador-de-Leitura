import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import ReadingSessionsLoading from "@/app/(app)/sessions/loading";
import { ReadingSessionsView } from "@/features/reading/components/reading-sessions-view";
import {
  INITIAL_READING_SESSION_ACTION_STATE,
  summarizeReadingSessions,
  type ReadingSessionActionState,
  type ReadingSessionItem,
  type ReadingSessionWork,
} from "@/features/reading/domain/reading-sessions";

const works: ReadingSessionWork[] = [
  {
    currentProgress: 184,
    id: "10000000-0000-4000-8000-000000000101",
    progressUnit: "PAGE",
    title: "A mão esquerda da escuridão",
    totalProgress: 320,
  },
  {
    currentProgress: 12,
    id: "10000000-0000-4000-8000-000000000102",
    progressUnit: "CHAPTER",
    title: "O longo caminho para um pequeno planeta hostil",
    totalProgress: 36,
  },
  {
    currentProgress: 45,
    id: "10000000-0000-4000-8000-000000000103",
    progressUnit: "PERCENT",
    title: "Designing data-intensive applications",
    totalProgress: 100,
  },
];

const sessions: ReadingSessionItem[] = [
  {
    createdAt: "2026-07-15T22:00:00.000Z",
    durationSeconds: 3_600,
    endPosition: 184,
    id: "40000000-0000-4000-8000-000000000101",
    notes:
      "O conflito político ficou mais claro neste trecho; retomar a partir da chegada à capital.",
    occurredOn: "2026-07-15",
    progressUnit: "PAGE",
    startPosition: 142,
    workId: works[0]!.id,
    workTitle: works[0]!.title,
  },
  {
    createdAt: "2026-07-14T20:30:00.000Z",
    durationSeconds: 2_700,
    endPosition: 12,
    id: "40000000-0000-4000-8000-000000000102",
    notes: null,
    occurredOn: "2026-07-14",
    progressUnit: "CHAPTER",
    startPosition: 8,
    workId: works[1]!.id,
    workTitle: works[1]!.title,
  },
  {
    createdAt: "2026-07-12T13:00:00.000Z",
    durationSeconds: 1_500,
    endPosition: null,
    id: "40000000-0000-4000-8000-000000000103",
    notes: "Revisão de conceitos e marcações anteriores.",
    occurredOn: "2026-07-12",
    progressUnit: "PERCENT",
    startPosition: null,
    workId: works[2]!.id,
    workTitle: works[2]!.title,
  },
];

type PreviewPageProps = Readonly<{
  searchParams: Promise<{
    form?: string | string[];
    state?: string | string[];
  }>;
}>;

export default async function ReadingSessionsPreviewPage({
  searchParams,
}: PreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : "success";
  const form = typeof params.form === "string" ? params.form : "idle";

  if (state === "loading") {
    return (
      <AppShell displayName="Gabriel" previewPath="/sessions">
        <ReadingSessionsLoading />
      </AppShell>
    );
  }
  const previewSessions = state === "empty" ? [] : sessions;
  const formState: ReadingSessionActionState =
    form === "success"
      ? {
          fieldErrors: {},
          message: "Sessão registrada com sucesso.",
          status: "success",
        }
      : form === "error"
        ? {
            fieldErrors: {
              durationMinutes: ["A duração deve ser maior que zero."],
            },
            message: "Revise os campos antes de registrar a sessão.",
            status: "error",
          }
        : INITIAL_READING_SESSION_ACTION_STATE;

  return (
    <AppShell displayName="Gabriel" previewPath="/sessions">
      <ReadingSessionsView
        formPreviewState={formState}
        result={
          state === "error"
            ? { status: "error" }
            : {
                data: {
                  sessions: previewSessions,
                  summary: summarizeReadingSessions(previewSessions),
                  works,
                },
                status: "success",
              }
        }
        today="2026-07-15"
      />
    </AppShell>
  );
}
