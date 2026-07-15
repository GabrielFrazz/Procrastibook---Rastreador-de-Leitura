-- Atomic creation of works selected from trusted external catalog results.

create function public.create_catalog_work(
  p_type public.work_type,
  p_title text,
  p_progress_unit public.progress_unit,
  p_status public.reading_status,
  p_authors text[],
  p_provider public.external_provider,
  p_external_id text,
  p_subtitle text default null,
  p_description text default null,
  p_publisher text default null,
  p_published_year integer default null,
  p_language text default null,
  p_isbn_10 text default null,
  p_isbn_13 text default null,
  p_page_count integer default null,
  p_chapter_count integer default null,
  p_cover_path text default null,
  p_cover_external_url text default null,
  p_started_at timestamptz default null,
  p_genres text[] default array[]::text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  created_work_id uuid;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  p_external_id := btrim(p_external_id);

  if p_external_id = '' or length(p_external_id) > 256 then
    raise exception 'Referência externa inválida' using errcode = '22023';
  end if;

  if p_cover_external_url is not null and (
    (p_provider = 'GOOGLE_BOOKS' and p_cover_external_url !~* '^https://(books\.google\.com|books\.googleusercontent\.com)/')
    or (p_provider = 'OPEN_LIBRARY' and p_cover_external_url !~* '^https://covers\.openlibrary\.org/')
  ) then
    raise exception 'URL de capa externa inválida' using errcode = '22023';
  end if;

  created_work_id := public.create_manual_work(
    p_type => p_type,
    p_title => p_title,
    p_progress_unit => p_progress_unit,
    p_status => p_status,
    p_authors => p_authors,
    p_subtitle => p_subtitle,
    p_description => p_description,
    p_publisher => p_publisher,
    p_published_year => p_published_year,
    p_language => p_language,
    p_isbn_13 => p_isbn_13,
    p_page_count => p_page_count,
    p_chapter_count => p_chapter_count,
    p_cover_path => p_cover_path,
    p_started_at => p_started_at,
    p_genres => p_genres
  );

  update public.works
  set
    isbn_10 = p_isbn_10,
    cover_external_url = p_cover_external_url
  where id = created_work_id and owner_id = current_owner_id;

  insert into public.work_external_sources (
    owner_id,
    work_id,
    provider,
    external_id,
    normalized_snapshot
  )
  values (
    current_owner_id,
    created_work_id,
    p_provider,
    p_external_id,
    jsonb_strip_nulls(jsonb_build_object(
      'authors', p_authors,
      'coverUrl', p_cover_external_url,
      'description', p_description,
      'externalId', p_external_id,
      'genres', p_genres,
      'isbn10', p_isbn_10,
      'isbn13', p_isbn_13,
      'language', p_language,
      'pageCount', p_page_count,
      'provider', p_provider,
      'publishedYear', p_published_year,
      'publisher', p_publisher,
      'subtitle', p_subtitle,
      'title', p_title
    ))
  );

  return created_work_id;
end;
$$;

revoke all on function public.create_catalog_work(
  public.work_type,
  text,
  public.progress_unit,
  public.reading_status,
  text[],
  public.external_provider,
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  timestamptz,
  text[]
) from public, anon;

grant execute on function public.create_catalog_work(
  public.work_type,
  text,
  public.progress_unit,
  public.reading_status,
  text[],
  public.external_provider,
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  timestamptz,
  text[]
) to authenticated;
