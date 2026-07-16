export type StatisticsInput = Readonly<{
  progressEvents: readonly Readonly<{
    eventType: "CORRECTION" | "UPDATE";
    newValue: number;
    previousValue: number;
    recordedAt: string;
    workId: string;
  }>[];
  reviews: readonly Readonly<{ rating: number }>[];
  sessions: readonly Readonly<{
    durationSeconds: number;
    endPosition: number | null;
    occurredOn: string;
    progressUnit: "CHAPTER" | "PAGE" | "PERCENT";
    startPosition: number | null;
    workId: string;
  }>[];
  works: readonly Readonly<{
    finishedAt: string | null;
    id: string;
    progressUnit: "CHAPTER" | "PAGE" | "PERCENT";
    status: "ABANDONED" | "FINISHED" | "READING" | "WANT_TO_READ";
    title: string;
  }>[];
}>;

export type ReadingStatistics = Readonly<{
  activity: readonly Readonly<{
    chaptersRead: number;
    label: string;
    minutesRead: number;
    month: string;
    pagesRead: number;
    worksFinished: number;
  }>[];
  averageRating: number;
  chaptersRead: number;
  minutesRead: number;
  pagesRead: number;
  readingSpeedPagesPerHour: number;
  statusCounts: Readonly<{
    abandoned: number;
    finished: number;
    reading: number;
    wantToRead: number;
  }>;
  topWorks: readonly Readonly<{
    minutesRead: number;
    title: string;
    workId: string;
  }>[];
  totalWorks: number;
}>;

type CalculationOptions = Readonly<{
  months?: number;
  now?: Date;
  timezone?: string;
}>;

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getPositiveDifference(start: number | null, end: number | null) {
  return start === null || end === null ? 0 : Math.max(0, end - start);
}

function getDateParts(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function timestampMonth(value: string, timezone: string) {
  const parts = getDateParts(new Date(value), timezone);
  return `${parts.year}-${parts.month}`;
}

function getRecentMonths(now: Date, timezone: string, amount: number) {
  const parts = getDateParts(now, timezone);
  const year = Number(parts.year);
  const monthIndex = Number(parts.month) - 1;

  return Array.from({ length: amount }, (_, index) => {
    const date = new Date(
      Date.UTC(year, monthIndex - (amount - index - 1), 1, 12),
    );
    return {
      label: new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        timeZone: "UTC",
      })
        .format(date)
        .replace(".", ""),
      month: date.toISOString().slice(0, 7),
    };
  });
}

export function calculateReadingStatistics(
  input: StatisticsInput,
  {
    months = 6,
    now = new Date(),
    timezone = "America/Sao_Paulo",
  }: CalculationOptions = {},
): ReadingStatistics {
  const workById = new Map(input.works.map((work) => [work.id, work]));
  const positiveUpdates = input.progressEvents.filter(
    (event) => event.eventType === "UPDATE",
  );
  const pagesRead = round(
    positiveUpdates
      .filter((event) => workById.get(event.workId)?.progressUnit === "PAGE")
      .reduce(
        (total, event) =>
          total + Math.max(0, event.newValue - event.previousValue),
        0,
      ),
  );
  const chaptersRead = round(
    positiveUpdates
      .filter((event) => workById.get(event.workId)?.progressUnit === "CHAPTER")
      .reduce(
        (total, event) =>
          total + Math.max(0, event.newValue - event.previousValue),
        0,
      ),
  );
  const totalSeconds = input.sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );
  const pageSessions = input.sessions.filter(
    (session) =>
      session.progressUnit === "PAGE" &&
      getPositiveDifference(session.startPosition, session.endPosition) > 0,
  );
  const pageSessionSeconds = pageSessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );
  const pageSessionUnits = pageSessions.reduce(
    (total, session) =>
      total + getPositiveDifference(session.startPosition, session.endPosition),
    0,
  );
  const recentMonths = getRecentMonths(now, timezone, Math.max(1, months));
  const activity = recentMonths.map(({ label, month }) => {
    const monthlyEvents = positiveUpdates.filter(
      (event) => timestampMonth(event.recordedAt, timezone) === month,
    );

    return {
      chaptersRead: round(
        monthlyEvents
          .filter(
            (event) => workById.get(event.workId)?.progressUnit === "CHAPTER",
          )
          .reduce(
            (total, event) =>
              total + Math.max(0, event.newValue - event.previousValue),
            0,
          ),
      ),
      label,
      minutesRead: Math.round(
        input.sessions
          .filter((session) => session.occurredOn.startsWith(month))
          .reduce((total, session) => total + session.durationSeconds, 0) / 60,
      ),
      month,
      pagesRead: round(
        monthlyEvents
          .filter(
            (event) => workById.get(event.workId)?.progressUnit === "PAGE",
          )
          .reduce(
            (total, event) =>
              total + Math.max(0, event.newValue - event.previousValue),
            0,
          ),
      ),
      worksFinished: input.works.filter(
        (work) =>
          work.finishedAt &&
          timestampMonth(work.finishedAt, timezone) === month,
      ).length,
    };
  });
  const secondsByWork = new Map<string, number>();

  input.sessions.forEach((session) => {
    secondsByWork.set(
      session.workId,
      (secondsByWork.get(session.workId) ?? 0) + session.durationSeconds,
    );
  });

  return {
    activity,
    averageRating:
      input.reviews.length === 0
        ? 0
        : round(
            input.reviews.reduce((total, review) => total + review.rating, 0) /
              input.reviews.length,
          ),
    chaptersRead,
    minutesRead: Math.round(totalSeconds / 60),
    pagesRead,
    readingSpeedPagesPerHour:
      pageSessionSeconds === 0
        ? 0
        : round(pageSessionUnits / (pageSessionSeconds / 3_600)),
    statusCounts: {
      abandoned: input.works.filter((work) => work.status === "ABANDONED")
        .length,
      finished: input.works.filter((work) => work.status === "FINISHED").length,
      reading: input.works.filter((work) => work.status === "READING").length,
      wantToRead: input.works.filter((work) => work.status === "WANT_TO_READ")
        .length,
    },
    topWorks: [...secondsByWork.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5)
      .map(([workId, seconds]) => ({
        minutesRead: Math.round(seconds / 60),
        title: workById.get(workId)?.title ?? "Obra removida",
        workId,
      })),
    totalWorks: input.works.length,
  };
}
