import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import {
  calculateDashboardSummary,
  type DashboardSummary,
} from "@/features/dashboard/domain/dashboard-summary";

const previewSummary: DashboardSummary = {
  totalWorks: 12,
  statusCounts: {
    wantToRead: 5,
    reading: 3,
    finished: 3,
    abandoned: 1,
  },
  pagesRead: 1248,
  minutesRead: 2175,
  readingSpeedPagesPerHour: 31.4,
  currentWorks: [
    {
      id: "preview-work-1",
      title: "O design do dia a dia",
      type: "BOOK",
      progressUnit: "PAGE",
      currentProgress: 184,
      totalProgress: 320,
      progressPercent: 57.5,
    },
    {
      id: "preview-work-2",
      title:
        "Uma história longa o bastante para testar títulos extensos no dashboard",
      type: "EBOOK",
      progressUnit: "PERCENT",
      currentProgress: 42,
      totalProgress: 100,
      progressPercent: 42,
    },
    {
      id: "preview-work-3",
      title: "Interfaces para quem lê",
      type: "ARTICLE",
      progressUnit: "PAGE",
      currentProgress: 18,
      totalProgress: null,
      progressPercent: null,
    },
  ],
  recentSessions: [
    {
      id: "preview-session-1",
      workTitle: "O design do dia a dia",
      occurredOn: "2026-07-14",
      durationMinutes: 48,
      unitsRead: 26,
      progressUnit: "PAGE",
    },
    {
      id: "preview-session-2",
      workTitle:
        "Uma história longa o bastante para testar títulos extensos no dashboard",
      occurredOn: "2026-07-13",
      durationMinutes: 35,
      unitsRead: 12,
      progressUnit: "PERCENT",
    },
    {
      id: "preview-session-3",
      workTitle: "Interfaces para quem lê",
      occurredOn: "2026-07-11",
      durationMinutes: 24,
      unitsRead: 8,
      progressUnit: "PAGE",
    },
  ],
  recentReviews: [
    {
      id: "preview-review-1",
      workTitle: "A biblioteca da meia-noite",
      rating: 4.5,
      updatedAt: "2026-07-12T15:00:00.000Z",
    },
    {
      id: "preview-review-2",
      workTitle: "Entendendo algoritmos",
      rating: 4,
      updatedAt: "2026-07-08T15:00:00.000Z",
    },
  ],
  activeGoal: {
    id: "preview-goal-1",
    metric: "PAGES_READ",
    targetValue: 1500,
    currentValue: 1248,
    progressPercent: 83.2,
    periodEnd: "2026-07-31",
  },
};

type ShellPreviewPageProps = Readonly<{
  searchParams: Promise<{ state?: string | string[] }>;
}>;

export default async function ShellPreviewPage({
  searchParams,
}: ShellPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : undefined;
  const emptySummary = calculateDashboardSummary({
    works: [],
    progressEvents: [],
    sessions: [],
    reviews: [],
    goals: [],
  });

  return (
    <AppShell displayName="Gabriel" previewPath="/dashboard">
      <DashboardView
        result={
          state === "error"
            ? { status: "error" }
            : {
                status: "success",
                summary: state === "empty" ? emptySummary : previewSummary,
              }
        }
      />
    </AppShell>
  );
}
