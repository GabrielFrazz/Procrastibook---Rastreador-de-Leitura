import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ReadingStatisticsView } from "@/features/statistics/components/reading-statistics-view";
import type { ReadingStatistics } from "@/features/statistics/domain/reading-statistics";

const statistics: ReadingStatistics = {
  activity: [
    {
      chaptersRead: 2,
      label: "fev",
      minutesRead: 120,
      month: "2026-02",
      pagesRead: 90,
      worksFinished: 1,
    },
    {
      chaptersRead: 5,
      label: "mar",
      minutesRead: 260,
      month: "2026-03",
      pagesRead: 210,
      worksFinished: 2,
    },
    {
      chaptersRead: 0,
      label: "abr",
      minutesRead: 180,
      month: "2026-04",
      pagesRead: 156,
      worksFinished: 1,
    },
    {
      chaptersRead: 8,
      label: "mai",
      minutesRead: 410,
      month: "2026-05",
      pagesRead: 284,
      worksFinished: 3,
    },
    {
      chaptersRead: 12,
      label: "jun",
      minutesRead: 350,
      month: "2026-06",
      pagesRead: 246,
      worksFinished: 2,
    },
    {
      chaptersRead: 4,
      label: "jul",
      minutesRead: 525,
      month: "2026-07",
      pagesRead: 318,
      worksFinished: 2,
    },
  ],
  averageRating: 4.4,
  chaptersRead: 31,
  minutesRead: 1_845,
  pagesRead: 1_304,
  readingSpeedPagesPerHour: 38.7,
  statusCounts: { abandoned: 2, finished: 18, reading: 4, wantToRead: 9 },
  topWorks: [
    { minutesRead: 360, title: "A mão esquerda da escuridão", workId: "1" },
    {
      minutesRead: 285,
      title: "O longo caminho para um pequeno planeta hostil",
      workId: "2",
    },
    { minutesRead: 210, title: "Fullmetal Alchemist", workId: "3" },
  ],
  totalWorks: 33,
};

type PreviewPageProps = Readonly<{
  searchParams: Promise<{ state?: string | string[] }>;
}>;

export default async function StatisticsPreviewPage({
  searchParams,
}: PreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : "success";

  return (
    <AppShell displayName="Gabriel" previewPath="/statistics">
      <ReadingStatisticsView
        result={
          state === "error"
            ? { status: "error" }
            : {
                data:
                  state === "empty"
                    ? {
                        activity: [],
                        averageRating: 0,
                        chaptersRead: 0,
                        minutesRead: 0,
                        pagesRead: 0,
                        readingSpeedPagesPerHour: 0,
                        statusCounts: {
                          abandoned: 0,
                          finished: 0,
                          reading: 0,
                          wantToRead: 0,
                        },
                        topWorks: [],
                        totalWorks: 0,
                      }
                    : statistics,
                status: "success",
              }
        }
      />
    </AppShell>
  );
}
