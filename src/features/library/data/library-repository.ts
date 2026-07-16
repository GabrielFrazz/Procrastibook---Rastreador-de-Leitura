import {
  getProgressPercent,
  getWorkTotal,
  type LibraryWork,
} from "@/features/library/domain/library-catalog";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WorkRow = Database["public"]["Tables"]["works"]["Row"];

type LibraryWorkRecord = Pick<
  WorkRow,
  | "chapter_count"
  | "cover_external_url"
  | "cover_path"
  | "current_progress"
  | "id"
  | "isbn_10"
  | "isbn_13"
  | "doi"
  | "page_count"
  | "progress_unit"
  | "status"
  | "subtitle"
  | "title"
  | "type"
  | "updated_at"
>;

export class LibraryQueryError extends Error {
  constructor() {
    super("Não foi possível carregar a biblioteca.");
    this.name = "LibraryQueryError";
  }
}

function addToMap<T>(map: Map<string, T[]>, key: string, value: T) {
  map.set(key, [...(map.get(key) ?? []), value]);
}

export async function getLibraryWorks(): Promise<LibraryWork[]> {
  const supabase = await createServerSupabaseClient();
  const [
    worksResult,
    contributorsResult,
    linksResult,
    genresResult,
    reviewsResult,
  ] = await Promise.all([
    supabase
      .from("works")
      .select(
        "id, type, title, subtitle, isbn_10, isbn_13, doi, page_count, chapter_count, progress_unit, current_progress, status, cover_path, cover_external_url, updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("contributors").select("id, name"),
    supabase
      .from("work_contributors")
      .select("work_id, contributor_id, role, position")
      .order("position"),
    supabase.from("work_genres").select("work_id, genre"),
    supabase.from("reviews").select("work_id, rating"),
  ]);

  if (
    worksResult.error ||
    contributorsResult.error ||
    linksResult.error ||
    genresResult.error ||
    reviewsResult.error
  ) {
    throw new LibraryQueryError();
  }

  const contributorById = new Map(
    contributorsResult.data.map((contributor) => [
      contributor.id,
      contributor.name,
    ]),
  );
  const authorsByWork = new Map<string, string[]>();
  const genresByWork = new Map<string, string[]>();
  const ratingByWork = new Map(
    reviewsResult.data.map((review) => [review.work_id, review.rating]),
  );

  linksResult.data
    .filter((link) => link.role === "AUTHOR")
    .forEach((link) => {
      const author = contributorById.get(link.contributor_id);

      if (author) {
        addToMap(authorsByWork, link.work_id, author);
      }
    });
  genresResult.data.forEach((genre) => {
    addToMap(genresByWork, genre.work_id, genre.genre);
  });

  return Promise.all(
    (worksResult.data as LibraryWorkRecord[]).map(async (work) => {
      const totalProgress = getWorkTotal(work);
      let coverUrl = work.cover_external_url;

      if (work.cover_path) {
        const signedCover = await supabase.storage
          .from("covers")
          .createSignedUrl(work.cover_path, 60 * 60);

        if (!signedCover.error) {
          coverUrl = signedCover.data.signedUrl;
        }
      }

      return {
        authors: authorsByWork.get(work.id) ?? [],
        coverUrl,
        currentProgress: work.current_progress,
        genres: genresByWork.get(work.id) ?? [],
        id: work.id,
        identifiers: [work.isbn_10, work.isbn_13, work.doi].filter(
          (identifier): identifier is string => Boolean(identifier),
        ),
        progressPercent: getProgressPercent(
          work.current_progress,
          totalProgress,
        ),
        progressUnit: work.progress_unit,
        rating: ratingByWork.get(work.id) ?? null,
        status: work.status,
        subtitle: work.subtitle,
        title: work.title,
        totalProgress,
        type: work.type,
        updatedAt: work.updated_at,
      } satisfies LibraryWork;
    }),
  );
}
