import type { Database } from "@/lib/supabase/database.types";

type WorkRow = Database["public"]["Tables"]["works"]["Row"];
type ProgressEventRow = Database["public"]["Tables"]["progress_events"]["Row"];
type ReadingSessionRow =
  Database["public"]["Tables"]["reading_sessions"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

export type DashboardWorkRecord = Pick<
  WorkRow,
  | "id"
  | "title"
  | "type"
  | "status"
  | "progress_unit"
  | "current_progress"
  | "page_count"
  | "chapter_count"
  | "finished_at"
  | "updated_at"
> &
  Readonly<{ coverUrl?: string | null }>;

export type DashboardProgressEventRecord = Pick<
  ProgressEventRow,
  | "id"
  | "work_id"
  | "event_type"
  | "previous_value"
  | "new_value"
  | "recorded_at"
>;

export type DashboardReadingSessionRecord = Pick<
  ReadingSessionRow,
  | "id"
  | "work_id"
  | "occurred_on"
  | "duration_seconds"
  | "progress_unit"
  | "start_position"
  | "end_position"
>;

export type DashboardReviewRecord = Pick<
  ReviewRow,
  "id" | "work_id" | "rating" | "updated_at"
>;

export type DashboardGoalRecord = Pick<
  GoalRow,
  "id" | "metric" | "target_value" | "period_start" | "period_end"
>;

export type DashboardSummaryInput = Readonly<{
  works: DashboardWorkRecord[];
  progressEvents: DashboardProgressEventRecord[];
  sessions: DashboardReadingSessionRecord[];
  reviews: DashboardReviewRecord[];
  goals: DashboardGoalRecord[];
}>;

export type DashboardCurrentWork = Readonly<{
  coverUrl: string | null;
  id: string;
  title: string;
  type: WorkRow["type"];
  progressUnit: WorkRow["progress_unit"];
  currentProgress: number;
  totalProgress: number | null;
  progressPercent: number | null;
}>;

export type DashboardRecentSession = Readonly<{
  id: string;
  workTitle: string;
  occurredOn: string;
  durationMinutes: number;
  unitsRead: number;
  progressUnit: ReadingSessionRow["progress_unit"];
}>;

export type DashboardRecentReview = Readonly<{
  id: string;
  workTitle: string;
  rating: number;
  updatedAt: string;
}>;

export type DashboardGoal = Readonly<{
  id: string;
  metric: GoalRow["metric"];
  targetValue: number;
  currentValue: number;
  progressPercent: number;
  periodEnd: string;
}>;

export type DashboardSummary = Readonly<{
  totalWorks: number;
  statusCounts: Readonly<{
    wantToRead: number;
    reading: number;
    finished: number;
    abandoned: number;
  }>;
  pagesRead: number;
  minutesRead: number;
  readingSpeedPagesPerHour: number;
  currentWorks: DashboardCurrentWork[];
  recentSessions: DashboardRecentSession[];
  recentReviews: DashboardRecentReview[];
  activeGoal: DashboardGoal | null;
}>;

type DashboardCalculationOptions = Readonly<{
  now?: Date;
  timezone?: string;
}>;

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getDateKey(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: timezone,
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getTimestampDateKey(value: string, timezone: string) {
  return getDateKey(new Date(value), timezone);
}

function isWithinPeriod(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

function getPositiveDifference(
  startPosition: number | null,
  endPosition: number | null,
) {
  if (startPosition === null || endPosition === null) {
    return 0;
  }

  return Math.max(0, endPosition - startPosition);
}

function getWorkTotal(work: DashboardWorkRecord) {
  if (work.progress_unit === "PERCENT") {
    return 100;
  }

  if (work.progress_unit === "PAGE") {
    return work.page_count;
  }

  return work.chapter_count;
}

function getGoalCurrentValue(
  goal: DashboardGoalRecord,
  input: DashboardSummaryInput,
  workById: ReadonlyMap<string, DashboardWorkRecord>,
  timezone: string,
) {
  if (goal.metric === "WORKS_FINISHED") {
    return input.works.filter(
      (work) =>
        work.finished_at !== null &&
        isWithinPeriod(
          getTimestampDateKey(work.finished_at, timezone),
          goal.period_start,
          goal.period_end,
        ),
    ).length;
  }

  if (goal.metric === "MINUTES_READ") {
    const durationSeconds = input.sessions
      .filter((session) =>
        isWithinPeriod(session.occurred_on, goal.period_start, goal.period_end),
      )
      .reduce((total, session) => total + session.duration_seconds, 0);

    return Math.round(durationSeconds / 60);
  }

  const expectedUnit = goal.metric === "PAGES_READ" ? "PAGE" : "CHAPTER";

  return round(
    input.progressEvents
      .filter((event) => {
        const work = workById.get(event.work_id);

        return (
          event.event_type === "UPDATE" &&
          work?.progress_unit === expectedUnit &&
          isWithinPeriod(
            getTimestampDateKey(event.recorded_at, timezone),
            goal.period_start,
            goal.period_end,
          )
        );
      })
      .reduce(
        (total, event) =>
          total + Math.max(0, event.new_value - event.previous_value),
        0,
      ),
  );
}

export function calculateDashboardSummary(
  input: DashboardSummaryInput,
  {
    now = new Date(),
    timezone = "America/Sao_Paulo",
  }: DashboardCalculationOptions = {},
): DashboardSummary {
  const workById = new Map(input.works.map((work) => [work.id, work]));
  const today = getDateKey(now, timezone);
  const statusCounts = {
    wantToRead: input.works.filter((work) => work.status === "WANT_TO_READ")
      .length,
    reading: input.works.filter((work) => work.status === "READING").length,
    finished: input.works.filter((work) => work.status === "FINISHED").length,
    abandoned: input.works.filter((work) => work.status === "ABANDONED").length,
  };

  const pagesRead = round(
    input.progressEvents
      .filter(
        (event) =>
          event.event_type === "UPDATE" &&
          workById.get(event.work_id)?.progress_unit === "PAGE",
      )
      .reduce(
        (total, event) =>
          total + Math.max(0, event.new_value - event.previous_value),
        0,
      ),
  );
  const durationSeconds = input.sessions.reduce(
    (total, session) => total + session.duration_seconds,
    0,
  );
  const pageSessions = input.sessions.filter(
    (session) =>
      session.progress_unit === "PAGE" &&
      getPositiveDifference(session.start_position, session.end_position) > 0,
  );
  const pagesFromSessions = pageSessions.reduce(
    (total, session) =>
      total +
      getPositiveDifference(session.start_position, session.end_position),
    0,
  );
  const pageSessionSeconds = pageSessions.reduce(
    (total, session) => total + session.duration_seconds,
    0,
  );

  const currentWorks = input.works
    .filter((work) => work.status === "READING")
    .sort((first, second) => second.updated_at.localeCompare(first.updated_at))
    .slice(0, 3)
    .map((work) => {
      const totalProgress = getWorkTotal(work);

      return {
        coverUrl: work.coverUrl ?? null,
        id: work.id,
        title: work.title,
        type: work.type,
        progressUnit: work.progress_unit,
        currentProgress: work.current_progress,
        totalProgress,
        progressPercent:
          totalProgress === null
            ? null
            : Math.min(
                100,
                round((work.current_progress / totalProgress) * 100),
              ),
      };
    });

  const recentSessions = input.sessions
    .slice()
    .sort((first, second) =>
      second.occurred_on.localeCompare(first.occurred_on),
    )
    .slice(0, 4)
    .map((session) => ({
      id: session.id,
      workTitle: workById.get(session.work_id)?.title ?? "Obra indisponível",
      occurredOn: session.occurred_on,
      durationMinutes: Math.max(1, Math.round(session.duration_seconds / 60)),
      unitsRead: round(
        getPositiveDifference(session.start_position, session.end_position),
      ),
      progressUnit: session.progress_unit,
    }));

  const recentReviews = input.reviews
    .slice()
    .sort((first, second) => second.updated_at.localeCompare(first.updated_at))
    .slice(0, 3)
    .map((review) => ({
      id: review.id,
      workTitle: workById.get(review.work_id)?.title ?? "Obra indisponível",
      rating: review.rating,
      updatedAt: review.updated_at,
    }));

  const activeGoalRecord = input.goals
    .filter((goal) => isWithinPeriod(today, goal.period_start, goal.period_end))
    .sort((first, second) =>
      first.period_end.localeCompare(second.period_end),
    )[0];
  const activeGoal = activeGoalRecord
    ? (() => {
        const currentValue = getGoalCurrentValue(
          activeGoalRecord,
          input,
          workById,
          timezone,
        );

        return {
          id: activeGoalRecord.id,
          metric: activeGoalRecord.metric,
          targetValue: activeGoalRecord.target_value,
          currentValue,
          progressPercent: Math.min(
            100,
            round((currentValue / activeGoalRecord.target_value) * 100),
          ),
          periodEnd: activeGoalRecord.period_end,
        };
      })()
    : null;

  return {
    totalWorks: input.works.length,
    statusCounts,
    pagesRead,
    minutesRead: Math.round(durationSeconds / 60),
    readingSpeedPagesPerHour:
      pageSessionSeconds === 0
        ? 0
        : round(pagesFromSessions / (pageSessionSeconds / 3600)),
    currentWorks,
    recentSessions,
    recentReviews,
    activeGoal,
  };
}
