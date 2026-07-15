-- Validated, transactional commands for personal reading lists.

alter table public.reading_lists
  add constraint reading_lists_name_length check (char_length(name::text) <= 80),
  add constraint reading_lists_description_length check (
    description is null or char_length(description) <= 500
  );

create function public.create_reading_list(
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  created_list_id uuid;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  insert into public.reading_lists (owner_id, name, description)
  values (
    current_owner_id,
    btrim(p_name),
    nullif(btrim(p_description), '')
  )
  returning id into created_list_id;

  return created_list_id;
end;
$$;

create function public.add_work_to_reading_list(
  p_list_id uuid,
  p_work_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  insert into public.reading_list_items (owner_id, list_id, work_id)
  values (current_owner_id, p_list_id, p_work_id);

  update public.reading_lists
  set updated_at = now()
  where id = p_list_id and owner_id = current_owner_id;
end;
$$;

create function public.remove_work_from_reading_list(
  p_list_id uuid,
  p_work_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  deleted_count integer;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  delete from public.reading_list_items
  where
    owner_id = current_owner_id
    and list_id = p_list_id
    and work_id = p_work_id;

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    return false;
  end if;

  update public.reading_lists
  set updated_at = now()
  where id = p_list_id and owner_id = current_owner_id;

  return true;
end;
$$;

create function public.delete_reading_list(p_list_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  deleted_count integer;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  delete from public.reading_lists
  where id = p_list_id and owner_id = current_owner_id;

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke all on function public.create_reading_list(text, text) from public, anon;
revoke all on function public.add_work_to_reading_list(uuid, uuid) from public, anon;
revoke all on function public.remove_work_from_reading_list(uuid, uuid) from public, anon;
revoke all on function public.delete_reading_list(uuid) from public, anon;

grant execute on function public.create_reading_list(text, text) to authenticated;
grant execute on function public.add_work_to_reading_list(uuid, uuid) to authenticated;
grant execute on function public.remove_work_from_reading_list(uuid, uuid) to authenticated;
grant execute on function public.delete_reading_list(uuid) to authenticated;
