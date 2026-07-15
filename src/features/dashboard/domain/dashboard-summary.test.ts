import { describe, expect, it } from "vitest";

import {
  calculateDashboardSummary,
  type DashboardSummaryInput,
} from "@/features/dashboard/domain/dashboard-summary";

const emptyInput: DashboardSummaryInput = {
  works: [],
  progressEvents: [],
  sessions: [],
  reviews: [],
  goals: [],
};

describe("calculateDashboardSummary", () => {
  it("returns a stable empty summary", () => {
    expect(calculateDashboardSummary(emptyInput)).toEqual({
      totalWorks: 0,
      statusCounts: {
        wantToRead: 0,
        reading: 0,
        finished: 0,
        abandoned: 0,
      },
      pagesRead: 0,
      minutesRead: 0,
      readingSpeedPagesPerHour: 0,
      currentWorks: [],
      recentSessions: [],
      recentReviews: [],
      activeGoal: null,
    });
  });

  it("calculates reading metrics and ignores progress corrections", () => {
    const input: DashboardSummaryInput = {
      works: [
        {
          id: "book-1",
          title: "Design de sistemas",
          type: "BOOK",
          status: "READING",
          progress_unit: "PAGE",
          current_progress: 50,
          page_count: 100,
          chapter_count: null,
          finished_at: null,
          updated_at: "2026-07-14T15:00:00.000Z",
        },
        {
          id: "manga-1",
          title: "Mangá concluído",
          type: "MANGA",
          status: "FINISHED",
          progress_unit: "CHAPTER",
          current_progress: 12,
          page_count: null,
          chapter_count: 12,
          finished_at: "2026-07-10T15:00:00.000Z",
          updated_at: "2026-07-10T15:00:00.000Z",
        },
      ],
      progressEvents: [
        {
          id: "event-1",
          work_id: "book-1",
          event_type: "UPDATE",
          previous_value: 0,
          new_value: 20,
          recorded_at: "2026-07-10T15:00:00.000Z",
        },
        {
          id: "event-2",
          work_id: "book-1",
          event_type: "CORRECTION",
          previous_value: 20,
          new_value: 10,
          recorded_at: "2026-07-11T15:00:00.000Z",
        },
        {
          id: "event-3",
          work_id: "manga-1",
          event_type: "UPDATE",
          previous_value: 0,
          new_value: 3,
          recorded_at: "2026-07-10T15:00:00.000Z",
        },
      ],
      sessions: [
        {
          id: "session-1",
          work_id: "book-1",
          occurred_on: "2026-07-10",
          duration_seconds: 1800,
          progress_unit: "PAGE",
          start_position: 10,
          end_position: 30,
        },
        {
          id: "session-2",
          work_id: "manga-1",
          occurred_on: "2026-07-11",
          duration_seconds: 1200,
          progress_unit: "CHAPTER",
          start_position: 2,
          end_position: 5,
        },
      ],
      reviews: [
        {
          id: "review-1",
          work_id: "manga-1",
          rating: 4.5,
          updated_at: "2026-07-12T15:00:00.000Z",
        },
      ],
      goals: [
        {
          id: "goal-1",
          metric: "PAGES_READ",
          target_value: 40,
          period_start: "2026-07-01",
          period_end: "2026-07-31",
        },
      ],
    };

    const summary = calculateDashboardSummary(input, {
      now: new Date("2026-07-14T15:00:00.000Z"),
    });

    expect(summary.statusCounts).toEqual({
      wantToRead: 0,
      reading: 1,
      finished: 1,
      abandoned: 0,
    });
    expect(summary.pagesRead).toBe(20);
    expect(summary.minutesRead).toBe(50);
    expect(summary.readingSpeedPagesPerHour).toBe(40);
    expect(summary.currentWorks[0]?.progressPercent).toBe(50);
    expect(summary.recentSessions[0]?.workTitle).toBe("Mangá concluído");
    expect(summary.recentReviews[0]?.rating).toBe(4.5);
    expect(summary.activeGoal).toMatchObject({
      currentValue: 20,
      progressPercent: 50,
    });
  });

  it("keeps unknown totals explicit and caps displayed percentages", () => {
    const summary = calculateDashboardSummary({
      ...emptyInput,
      works: [
        {
          id: "unknown-total",
          title: "Artigo sem total",
          type: "ARTICLE",
          status: "READING",
          progress_unit: "PAGE",
          current_progress: 12,
          page_count: null,
          chapter_count: null,
          finished_at: null,
          updated_at: "2026-07-14T15:00:00.000Z",
        },
        {
          id: "percent-work",
          title: "E-book",
          type: "EBOOK",
          status: "READING",
          progress_unit: "PERCENT",
          current_progress: 100,
          page_count: null,
          chapter_count: null,
          finished_at: null,
          updated_at: "2026-07-13T15:00:00.000Z",
        },
      ],
    });

    expect(summary.currentWorks[0]).toMatchObject({
      totalProgress: null,
      progressPercent: null,
    });
    expect(summary.currentWorks[1]).toMatchObject({
      totalProgress: 100,
      progressPercent: 100,
    });
  });
});
