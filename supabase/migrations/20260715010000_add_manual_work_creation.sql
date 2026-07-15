-- Cadastro manual atômico e armazenamento privado de capas.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Usuários leem as próprias capas"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Usuários enviam as próprias capas"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Usuários atualizam as próprias capas"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Usuários excluem as próprias capas"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create function public.create_manual_work(
  p_type public.work_type,
  p_title text,
  p_progress_unit public.progress_unit,
  p_status public.reading_status,
  p_authors text[],
  p_subtitle text default null,
  p_description text default null,
  p_publisher text default null,
  p_published_year integer default null,
  p_language text default null,
  p_isbn_13 text default null,
  p_page_count integer default null,
  p_chapter_count integer default null,
  p_cover_path text default null,
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
  contributor_id uuid;
  author_name text;
  author_position smallint := 0;
  genre_name text;
  initial_progress numeric(10, 2) := 0;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  if coalesce(cardinality(p_authors), 0) = 0 or cardinality(p_authors) > 8 then
    raise exception 'Informe entre um e oito autores' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_genres), 0) > 10 then
    raise exception 'Informe no máximo dez gêneros' using errcode = '22023';
  end if;

  if p_cover_path is not null
    and split_part(p_cover_path, '/', 1) <> current_owner_id::text
  then
    raise exception 'O caminho da capa não pertence ao usuário autenticado'
      using errcode = '42501';
  end if;

  if p_status = 'FINISHED' then
    initial_progress := case p_progress_unit
      when 'PERCENT' then 100
      when 'PAGE' then coalesce(p_page_count, 0)
      when 'CHAPTER' then coalesce(p_chapter_count, 0)
    end;
  end if;

  insert into public.works (
    owner_id,
    type,
    title,
    subtitle,
    description,
    publisher,
    published_year,
    language,
    isbn_13,
    page_count,
    chapter_count,
    progress_unit,
    current_progress,
    status,
    cover_path,
    started_at,
    finished_at
  )
  values (
    current_owner_id,
    p_type,
    p_title,
    p_subtitle,
    p_description,
    p_publisher,
    p_published_year,
    p_language,
    p_isbn_13,
    p_page_count,
    p_chapter_count,
    p_progress_unit,
    initial_progress,
    p_status,
    p_cover_path,
    p_started_at,
    case when p_status = 'FINISHED' then now() else null end
  )
  returning id into created_work_id;

  foreach author_name in array p_authors loop
    author_name := btrim(author_name);

    if author_name = '' then
      raise exception 'O nome do autor não pode estar vazio' using errcode = '22023';
    end if;

    insert into public.contributors (owner_id, name)
    values (current_owner_id, author_name)
    on conflict (owner_id, normalized_name) do update
    set name = excluded.name
    returning id into contributor_id;

    insert into public.work_contributors (
      owner_id,
      work_id,
      contributor_id,
      role,
      position
    )
    values (
      current_owner_id,
      created_work_id,
      contributor_id,
      'AUTHOR',
      author_position
    )
    on conflict do nothing;

    author_position := author_position + 1;
  end loop;

  foreach genre_name in array coalesce(p_genres, array[]::text[]) loop
    genre_name := btrim(genre_name);

    if genre_name <> '' then
      insert into public.work_genres (owner_id, work_id, genre)
      values (current_owner_id, created_work_id, genre_name)
      on conflict do nothing;
    end if;
  end loop;

  return created_work_id;
end;
$$;

revoke all on function public.create_manual_work(
  public.work_type,
  text,
  public.progress_unit,
  public.reading_status,
  text[],
  text,
  text,
  text,
  integer,
  text,
  text,
  integer,
  integer,
  text,
  timestamptz,
  text[]
) from public, anon;

grant execute on function public.create_manual_work(
  public.work_type,
  text,
  public.progress_unit,
  public.reading_status,
  text[],
  text,
  text,
  text,
  integer,
  text,
  text,
  integer,
  integer,
  text,
  timestamptz,
  text[]
) to authenticated;