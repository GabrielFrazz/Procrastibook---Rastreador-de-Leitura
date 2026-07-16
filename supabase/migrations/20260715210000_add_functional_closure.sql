-- Functional closure: private avatars and atomic work management commands.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Usuários leem o próprio avatar"
on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuários enviam o próprio avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuários atualizam o próprio avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuários excluem o próprio avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.profiles
add constraint profiles_avatar_path_owned
check (avatar_path is null or split_part(avatar_path, '/', 1) = id::text);

create function public.update_owned_work(
  p_work_id uuid,
  p_type public.work_type,
  p_title text,
  p_status public.reading_status,
  p_authors text[],
  p_subtitle text default null,
  p_description text default null,
  p_publisher text default null,
  p_published_year integer default null,
  p_language text default null,
  p_isbn_10 text default null,
  p_isbn_13 text default null,
  p_doi text default null,
  p_page_count integer default null,
  p_chapter_count integer default null,
  p_genres text[] default array[]::text[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  work_record record;
  contributor_id uuid;
  author_name text;
  author_position smallint := 0;
  genre_name text;
  completed_progress numeric(10, 2);
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  if p_work_id is null or p_title is null or p_type is null or p_status is null then
    raise exception 'Dados obrigatórios ausentes' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_authors), 0) = 0 or cardinality(p_authors) > 8 then
    raise exception 'Informe entre um e oito autores' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_genres), 0) > 10 then
    raise exception 'Informe no máximo dez gêneros' using errcode = '22023';
  end if;

  select id, progress_unit, current_progress, started_at, finished_at
  into work_record
  from public.works
  where id = p_work_id and owner_id = current_owner_id
  for update;

  if not found then
    raise exception 'Obra não encontrada' using errcode = '42501';
  end if;

  completed_progress := case work_record.progress_unit
    when 'PERCENT' then 100
    when 'PAGE' then p_page_count
    when 'CHAPTER' then p_chapter_count
  end;

  if completed_progress is not null and completed_progress < work_record.current_progress then
    raise exception 'O total não pode ser menor que o progresso atual' using errcode = '22023';
  end if;

  update public.works
  set type = p_type,
      title = btrim(p_title),
      subtitle = nullif(btrim(p_subtitle), ''),
      description = nullif(btrim(p_description), ''),
      publisher = nullif(btrim(p_publisher), ''),
      published_year = p_published_year,
      language = nullif(btrim(p_language), ''),
      isbn_10 = nullif(upper(regexp_replace(p_isbn_10, '[^0-9X]', '', 'g')), ''),
      isbn_13 = nullif(regexp_replace(p_isbn_13, '[^0-9]', '', 'g'), ''),
      doi = nullif(btrim(p_doi), ''),
      page_count = p_page_count,
      chapter_count = p_chapter_count,
      status = p_status,
      current_progress = case
        when p_status = 'FINISHED' and completed_progress is not null then completed_progress
        else current_progress
      end,
      started_at = case
        when p_status in ('READING', 'FINISHED') then coalesce(started_at, now())
        else started_at
      end,
      finished_at = case
        when p_status = 'FINISHED' then coalesce(finished_at, now())
        else null
      end
  where id = p_work_id and owner_id = current_owner_id;

  if p_status = 'FINISHED'
    and completed_progress is not null
    and completed_progress <> work_record.current_progress
  then
    insert into public.progress_events (
      owner_id, work_id, event_type, previous_value, new_value
    )
    values (
      current_owner_id, p_work_id, 'UPDATE', work_record.current_progress, completed_progress
    );
  end if;

  delete from public.work_contributors
  where work_id = p_work_id and owner_id = current_owner_id and role = 'AUTHOR';

  foreach author_name in array p_authors loop
    author_name := btrim(regexp_replace(author_name, '\s+', ' ', 'g'));

    if author_name = '' or length(author_name) > 120 then
      raise exception 'Nome de autor inválido' using errcode = '22023';
    end if;

    insert into public.contributors (owner_id, name)
    values (current_owner_id, author_name)
    on conflict (owner_id, normalized_name) do update set name = excluded.name
    returning id into contributor_id;

    insert into public.work_contributors (
      owner_id, work_id, contributor_id, role, position
    )
    values (current_owner_id, p_work_id, contributor_id, 'AUTHOR', author_position);

    author_position := author_position + 1;
  end loop;

  delete from public.work_genres
  where work_id = p_work_id and owner_id = current_owner_id;

  foreach genre_name in array coalesce(p_genres, array[]::text[]) loop
    genre_name := btrim(regexp_replace(genre_name, '\s+', ' ', 'g'));

    if genre_name <> '' then
      if length(genre_name) > 60 then
        raise exception 'Gênero inválido' using errcode = '22023';
      end if;

      insert into public.work_genres (owner_id, work_id, genre)
      values (current_owner_id, p_work_id, genre_name)
      on conflict do nothing;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.update_owned_work(
  uuid, public.work_type, text, public.reading_status, text[], text, text,
  text, integer, text, text, text, text, integer, integer, text[]
) from public, anon;

grant execute on function public.update_owned_work(
  uuid, public.work_type, text, public.reading_status, text[], text, text,
  text, integer, text, text, text, text, integer, integer, text[]
) to authenticated;

create function public.delete_owned_work(p_work_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  removed_cover_path text;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  delete from public.works
  where id = p_work_id and owner_id = current_owner_id
  returning cover_path into removed_cover_path;

  if not found then
    raise exception 'Obra não encontrada' using errcode = '42501';
  end if;

  return removed_cover_path;
end;
$$;

revoke all on function public.delete_owned_work(uuid) from public, anon;
grant execute on function public.delete_owned_work(uuid) to authenticated;
