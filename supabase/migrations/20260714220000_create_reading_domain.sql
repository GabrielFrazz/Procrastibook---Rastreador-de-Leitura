begin;

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.work_type as enum ('BOOK', 'MANGA', 'ARTICLE', 'EBOOK');
create type public.reading_status as enum ('WANT_TO_READ', 'READING', 'FINISHED', 'ABANDONED');
create type public.progress_unit as enum ('PAGE', 'CHAPTER', 'PERCENT');
create type public.progress_event_type as enum ('UPDATE', 'CORRECTION');
create type public.goal_metric as enum ('WORKS_FINISHED', 'PAGES_READ', 'CHAPTERS_READ', 'MINUTES_READ');
create type public.note_kind as enum ('NOTE', 'QUOTE');
create type public.external_provider as enum ('GOOGLE_BOOKS', 'OPEN_LIBRARY');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_path text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (display_name = btrim(display_name) and display_name <> ''),
  constraint profiles_timezone_not_blank check (timezone = btrim(timezone) and timezone <> '')
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Leitor'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    'Leitor'
  )
from auth.users as users
on conflict (id) do nothing;

create table public.works (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type public.work_type not null,
  title text not null,
  subtitle text,
  description text,
  publisher text,
  published_year smallint,
  language text,
  isbn_10 text,
  isbn_13 text,
  doi text,
  page_count integer,
  chapter_count integer,
  progress_unit public.progress_unit not null,
  current_progress numeric(10, 2) not null default 0,
  status public.reading_status not null default 'WANT_TO_READ',
  cover_path text,
  cover_external_url text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint works_id_owner_key unique (id, owner_id),
  constraint works_title_not_blank check (title = btrim(title) and title <> ''),
  constraint works_published_year_plausible check (published_year is null or published_year between 1000 and 2100),
  constraint works_language_not_blank check (language is null or (language = btrim(language) and language <> '')),
  constraint works_isbn_10_format check (isbn_10 is null or isbn_10 ~ '^[0-9]{9}[0-9X]$'),
  constraint works_isbn_13_format check (isbn_13 is null or isbn_13 ~ '^[0-9]{13}$'),
  constraint works_doi_not_blank check (doi is null or (doi = btrim(doi) and doi <> '')),
  constraint works_page_count_positive check (page_count is null or page_count > 0),
  constraint works_chapter_count_positive check (chapter_count is null or chapter_count > 0),
  constraint works_progress_non_negative check (current_progress >= 0),
  constraint works_percent_progress_limit check (progress_unit <> 'PERCENT' or current_progress <= 100),
  constraint works_page_progress_limit check (progress_unit <> 'PAGE' or page_count is null or current_progress <= page_count),
  constraint works_chapter_progress_limit check (progress_unit <> 'CHAPTER' or chapter_count is null or current_progress <= chapter_count),
  constraint works_progress_unit_allowed_for_type check (type = 'MANGA' or progress_unit <> 'CHAPTER'),
  constraint works_finished_after_started check (finished_at is null or started_at is null or finished_at >= started_at),
  constraint works_cover_external_url_format check (cover_external_url is null or cover_external_url ~* '^https?://')
);

create unique index works_owner_isbn_10_unique_idx on public.works (owner_id, isbn_10) where isbn_10 is not null;
create unique index works_owner_isbn_13_unique_idx on public.works (owner_id, isbn_13) where isbn_13 is not null;
create unique index works_owner_doi_unique_idx on public.works (owner_id, lower(doi)) where doi is not null;
create index works_owner_status_idx on public.works (owner_id, status);
create index works_owner_type_idx on public.works (owner_id, type);
create index works_owner_updated_at_idx on public.works (owner_id, updated_at desc);
create index works_title_trgm_idx on public.works using gin (lower(title) extensions.gin_trgm_ops);

create trigger works_set_updated_at
before update on public.works
for each row execute function public.set_updated_at();

create table public.contributors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contributors_id_owner_key unique (id, owner_id),
  constraint contributors_name_not_blank check (name = btrim(name) and name <> ''),
  constraint contributors_owner_normalized_name_key unique (owner_id, normalized_name)
);

create trigger contributors_set_updated_at
before update on public.contributors
for each row execute function public.set_updated_at();

create table public.work_contributors (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid not null,
  contributor_id uuid not null,
  role text not null default 'AUTHOR',
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (work_id, contributor_id, role),
  constraint work_contributors_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade,
  constraint work_contributors_contributor_owner_fk foreign key (contributor_id, owner_id)
    references public.contributors (id, owner_id) on delete cascade,
  constraint work_contributors_role_not_blank check (role = btrim(role) and role <> ''),
  constraint work_contributors_position_non_negative check (position >= 0)
);

create index work_contributors_owner_contributor_idx on public.work_contributors (owner_id, contributor_id);

create table public.work_genres (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid not null,
  genre extensions.citext not null,
  created_at timestamptz not null default now(),
  primary key (work_id, genre),
  constraint work_genres_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade,
  constraint work_genres_genre_not_blank check (genre = btrim(genre::text) and genre <> '')
);

create index work_genres_owner_genre_idx on public.work_genres (owner_id, genre);

create table public.work_external_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid not null,
  provider public.external_provider not null,
  external_id text not null,
  normalized_snapshot jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint work_external_sources_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade,
  constraint work_external_sources_external_id_not_blank check (external_id = btrim(external_id) and external_id <> ''),
  constraint work_external_sources_snapshot_object check (jsonb_typeof(normalized_snapshot) = 'object'),
  constraint work_external_sources_owner_provider_external_key unique (owner_id, provider, external_id)
);

create index work_external_sources_work_idx on public.work_external_sources (owner_id, work_id);

create table public.reading_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name extensions.citext not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_lists_id_owner_key unique (id, owner_id),
  constraint reading_lists_name_not_blank check (name = btrim(name::text) and name <> ''),
  constraint reading_lists_owner_name_key unique (owner_id, name)
);

create index reading_lists_owner_updated_at_idx on public.reading_lists (owner_id, updated_at desc);

create trigger reading_lists_set_updated_at
before update on public.reading_lists
for each row execute function public.set_updated_at();

create table public.reading_list_items (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  list_id uuid not null,
  work_id uuid not null,
  added_at timestamptz not null default now(),
  primary key (list_id, work_id),
  constraint reading_list_items_list_owner_fk foreign key (list_id, owner_id)
    references public.reading_lists (id, owner_id) on delete cascade,
  constraint reading_list_items_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade
);

create index reading_list_items_owner_work_idx on public.reading_list_items (owner_id, work_id);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid not null,
  occurred_on date not null default current_date,
  duration_seconds integer not null,
  progress_unit public.progress_unit not null,
  start_position numeric(10, 2),
  end_position numeric(10, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_sessions_id_work_owner_key unique (id, work_id, owner_id),
  constraint reading_sessions_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade,
  constraint reading_sessions_duration_positive check (duration_seconds > 0),
  constraint reading_sessions_start_non_negative check (start_position is null or start_position >= 0),
  constraint reading_sessions_end_non_negative check (end_position is null or end_position >= 0),
  constraint reading_sessions_positions_ordered check (
    start_position is null or end_position is null or end_position >= start_position
  )
);

create index reading_sessions_owner_occurred_on_idx on public.reading_sessions (owner_id, occurred_on desc);
create index reading_sessions_work_occurred_on_idx on public.reading_sessions (work_id, occurred_on desc);

create trigger reading_sessions_set_updated_at
before update on public.reading_sessions
for each row execute function public.set_updated_at();

create function public.validate_reading_session()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  work_record record;
  maximum_position numeric(10, 2);
begin
  select progress_unit, page_count, chapter_count
  into work_record
  from public.works
  where id = new.work_id and owner_id = new.owner_id;

  if not found then
    return new;
  end if;

  if new.progress_unit <> work_record.progress_unit then
    raise exception 'A unidade da sessão deve coincidir com a unidade de progresso da obra.'
      using errcode = '23514';
  end if;

  maximum_position := case new.progress_unit
    when 'PAGE' then work_record.page_count
    when 'CHAPTER' then work_record.chapter_count
    when 'PERCENT' then 100
  end;

  if maximum_position is not null and (
    coalesce(new.start_position, 0) > maximum_position
    or coalesce(new.end_position, 0) > maximum_position
  ) then
    raise exception 'A posição da sessão não pode superar o total da obra.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger reading_sessions_validate
before insert or update on public.reading_sessions
for each row execute function public.validate_reading_session();

create table public.progress_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid not null,
  session_id uuid,
  event_type public.progress_event_type not null,
  previous_value numeric(10, 2) not null,
  new_value numeric(10, 2) not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint progress_events_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade,
  constraint progress_events_session_work_owner_fk foreign key (session_id, work_id, owner_id)
    references public.reading_sessions (id, work_id, owner_id) on delete set null (session_id),
  constraint progress_events_previous_non_negative check (previous_value >= 0),
  constraint progress_events_new_non_negative check (new_value >= 0),
  constraint progress_events_reduction_is_correction check (
    new_value >= previous_value or event_type = 'CORRECTION'
  )
);

create index progress_events_owner_work_recorded_at_idx
  on public.progress_events (owner_id, work_id, recorded_at desc);
create index progress_events_session_idx on public.progress_events (session_id) where session_id is not null;

create function public.validate_progress_event()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  work_record record;
  maximum_progress numeric(10, 2);
begin
  select progress_unit, page_count, chapter_count
  into work_record
  from public.works
  where id = new.work_id and owner_id = new.owner_id;

  if not found then
    return new;
  end if;

  maximum_progress := case work_record.progress_unit
    when 'PAGE' then work_record.page_count
    when 'CHAPTER' then work_record.chapter_count
    when 'PERCENT' then 100
  end;

  if maximum_progress is not null and (
    new.previous_value > maximum_progress or new.new_value > maximum_progress
  ) then
    raise exception 'O evento de progresso não pode superar o total da obra.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger progress_events_validate
before insert or update on public.progress_events
for each row execute function public.validate_progress_event();

create function public.guard_work_progress_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.progress_unit <> old.progress_unit and (
    exists (select 1 from public.progress_events where work_id = old.id)
    or exists (select 1 from public.reading_sessions where work_id = old.id)
  ) then
    raise exception 'A unidade de progresso não pode ser alterada após existir histórico.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger works_guard_progress_unit
before update of progress_unit on public.works
for each row execute function public.guard_work_progress_unit();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid not null,
  rating numeric(2, 1) not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade,
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_owner_work_key unique (owner_id, work_id)
);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid not null,
  session_id uuid,
  kind public.note_kind not null,
  content text not null,
  location_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_work_owner_fk foreign key (work_id, owner_id)
    references public.works (id, owner_id) on delete cascade,
  constraint notes_session_work_owner_fk foreign key (session_id, work_id, owner_id)
    references public.reading_sessions (id, work_id, owner_id) on delete set null (session_id),
  constraint notes_content_not_blank check (content = btrim(content) and content <> ''),
  constraint notes_location_label_not_blank check (
    location_label is null or (location_label = btrim(location_label) and location_label <> '')
  )
);

create index notes_owner_work_kind_created_at_idx
  on public.notes (owner_id, work_id, kind, created_at desc);
create index notes_session_idx on public.notes (session_id) where session_id is not null;

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  metric public.goal_metric not null,
  target_value numeric(12, 2) not null,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_target_positive check (target_value > 0),
  constraint goals_period_valid check (period_end >= period_start)
);

create index goals_owner_period_idx on public.goals (owner_id, period_start, period_end);

create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

create table public.external_metadata_cache (
  provider public.external_provider not null,
  query_hash text not null,
  normalized_response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (provider, query_hash),
  constraint external_metadata_cache_query_hash_not_blank check (query_hash = btrim(query_hash) and query_hash <> ''),
  constraint external_metadata_cache_response_container check (
    jsonb_typeof(normalized_response) in ('array', 'object')
  )
);

create index external_metadata_cache_expires_at_idx on public.external_metadata_cache (expires_at);

revoke all on table
  public.profiles,
  public.works,
  public.contributors,
  public.work_contributors,
  public.work_genres,
  public.work_external_sources,
  public.reading_lists,
  public.reading_list_items,
  public.reading_sessions,
  public.progress_events,
  public.reviews,
  public.notes,
  public.goals,
  public.external_metadata_cache
from anon, authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_reading_session() from public, anon, authenticated;
revoke all on function public.validate_progress_event() from public, anon, authenticated;
revoke all on function public.guard_work_progress_unit() from public, anon, authenticated;

commit;
