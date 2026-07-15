import type {
  ReadingListsData,
  ReadingListWork,
} from "@/features/lists/domain/reading-lists";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class ReadingListsQueryError extends Error {
  constructor() {
    super("Não foi possível carregar as listas.");
    this.name = "ReadingListsQueryError";
  }
}

function addToMap<T>(map: Map<string, T[]>, key: string, value: T) {
  map.set(key, [...(map.get(key) ?? []), value]);
}

export async function getReadingListsData(): Promise<ReadingListsData> {
  const supabase = await createServerSupabaseClient();
  const [
    listsResult,
    itemsResult,
    worksResult,
    contributorsResult,
    linksResult,
  ] = await Promise.all([
    supabase
      .from("reading_lists")
      .select("id, name, description, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("reading_list_items")
      .select("list_id, work_id, added_at")
      .order("added_at", { ascending: false }),
    supabase.from("works").select("id, title, type, status").order("title"),
    supabase.from("contributors").select("id, name"),
    supabase
      .from("work_contributors")
      .select("work_id, contributor_id, role, position")
      .order("position"),
  ]);

  if (
    listsResult.error ||
    itemsResult.error ||
    worksResult.error ||
    contributorsResult.error ||
    linksResult.error
  ) {
    throw new ReadingListsQueryError();
  }

  const contributorById = new Map(
    contributorsResult.data.map((contributor) => [
      contributor.id,
      contributor.name,
    ]),
  );
  const authorsByWork = new Map<string, string[]>();

  linksResult.data
    .filter((link) => link.role === "AUTHOR")
    .forEach((link) => {
      const author = contributorById.get(link.contributor_id);

      if (author) {
        addToMap(authorsByWork, link.work_id, author);
      }
    });

  const works: ReadingListWork[] = worksResult.data.map((work) => ({
    authors: authorsByWork.get(work.id) ?? [],
    id: work.id,
    status: work.status,
    title: work.title,
    type: work.type,
  }));
  const workById = new Map(works.map((work) => [work.id, work]));
  const workIdsByList = new Map<string, string[]>();

  itemsResult.data.forEach((item) => {
    addToMap(workIdsByList, item.list_id, item.work_id);
  });

  return {
    lists: listsResult.data.map((list) => ({
      description: list.description,
      id: list.id,
      items: (workIdsByList.get(list.id) ?? [])
        .map((workId) => workById.get(workId))
        .filter((work): work is ReadingListWork => Boolean(work)),
      name: list.name,
      updatedAt: list.updated_at,
    })),
    works,
  };
}
