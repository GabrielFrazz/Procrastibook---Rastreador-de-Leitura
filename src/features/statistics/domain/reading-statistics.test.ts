import { describe, expect, it } from "vitest";

import {
  calculateReadingStatistics,
  type StatisticsInput,
} from "@/features/statistics/domain/reading-statistics";

const input: StatisticsInput = {
  progressEvents: [
    {
      eventType: "UPDATE",
      newValue: 70,
      previousValue: 20,
      recordedAt: "2026-07-10T12:00:00.000Z",
      workId: "page-work",
    },
    {
      eventType: "CORRECTION",
      newValue: 60,
      previousValue: 70,
      recordedAt: "2026-07-11T12:00:00.000Z",
      workId: "page-work",
    },
    {
      eventType: "UPDATE",
      newValue: 9,
      previousValue: 3,
      recordedAt: "2026-06-20T12:00:00.000Z",
      workId: "chapter-work",
    },
  ],
  reviews: [{ rating: 4 }, { rating: 5 }],
  sessions: [
    {
      durationSeconds: 3_600,
      endPosition: 70,
      occurredOn: "2026-07-10",
      progressUnit: "PAGE",
      startPosition: 20,
      workId: "page-work",
    },
    {
      durationSeconds: 1_800,
      endPosition: 9,
      occurredOn: "2026-06-20",
      progressUnit: "CHAPTER",
      startPosition: 3,
      workId: "chapter-work",
    },
  ],
  works: [
    {
      finishedAt: "2026-07-15T12:00:00.000Z",
      id: "page-work",
      progressUnit: "PAGE",
      status: "FINISHED",
      title: "Obra em páginas",
    },
    {
      finishedAt: null,
      id: "chapter-work",
      progressUnit: "CHAPTER",
      status: "READING",
      title: "Obra em capítulos",
    },
  ],
};

describe("calculateReadingStatistics", () => {
  it("calcula os indicadores sem contar correções como leitura", () => {
    const result = calculateReadingStatistics(input, {
      now: new Date("2026-07-15T12:00:00.000Z"),
    });
    expect(result).toMatchObject({
      averageRating: 4.5,
      chaptersRead: 6,
      minutesRead: 90,
      pagesRead: 50,
      readingSpeedPagesPerHour: 50,
      totalWorks: 2,
    });
  });

  it("organiza seis meses e distribui a atividade no mês correto", () => {
    const result = calculateReadingStatistics(input, {
      now: new Date("2026-07-15T12:00:00.000Z"),
    });
    expect(result.activity).toHaveLength(6);
    expect(result.activity.at(-1)).toMatchObject({
      minutesRead: 60,
      month: "2026-07",
      pagesRead: 50,
      worksFinished: 1,
    });
    expect(result.activity.at(-2)).toMatchObject({
      chaptersRead: 6,
      minutesRead: 30,
      month: "2026-06",
    });
  });

  it("ordena obras pelo tempo de leitura", () => {
    const result = calculateReadingStatistics(input);
    expect(result.topWorks.map((work) => work.workId)).toEqual([
      "page-work",
      "chapter-work",
    ]);
  });

  it("retorna zeros seguros sem dados de atividade", () => {
    const result = calculateReadingStatistics({
      progressEvents: [],
      reviews: [],
      sessions: [],
      works: [],
    });
    expect(result).toMatchObject({
      averageRating: 0,
      minutesRead: 0,
      readingSpeedPagesPerHour: 0,
      totalWorks: 0,
    });
  });
});
