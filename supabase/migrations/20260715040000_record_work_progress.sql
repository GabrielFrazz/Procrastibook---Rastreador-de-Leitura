-- Atomic progress changes are the only supported way to update current_progress.

revoke update on table public.works from authenticated;

grant update (
  type,
  title,
  subtitle,
  description,
  publisher,
  published_year,
  language,
  isbn_10,
  isbn_13,
  doi,
  page_count,
  chapter_count,
  progress_unit,
  status,
  cover_path,
  cover_external_url,
  started_at,
  finished_at
) on table public.works to authenticated;

create function public.record_work_progress(
  p_work_id uuid,
  p_new_value numeric,
  p_event_type public.progress_event_type,
  p_expected_previous_value numeric
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  work_record record;
  maximum_progress numeric;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  if
    p_new_value is null
    or p_expected_previous_value is null
    or p_event_type is null
  then
    raise exception 'Valores de progresso são obrigatórios' using errcode = '22023';
  end if;

  if
    p_new_value < 0
    or p_new_value > 99999999.99
    or round(p_new_value, 2) <> p_new_value
  then
    raise exception 'Novo progresso inválido' using errcode = '22023';
  end if;

  select
    id,
    owner_id,
    progress_unit,
    current_progress,
    page_count,
    chapter_count
  into work_record
  from public.works
  where id = p_work_id and owner_id = current_owner_id
  for update;

  if not found then
    raise exception 'Obra não encontrada' using errcode = '42501';
  end if;

  if work_record.current_progress <> p_expected_previous_value then
    raise exception 'O progresso foi alterado em outra operação'
      using errcode = '40001';
  end if;

  if p_new_value = work_record.current_progress then
    raise exception 'O novo progresso deve ser diferente do atual'
      using errcode = '22023';
  end if;

  maximum_progress := case work_record.progress_unit
    when 'PAGE' then work_record.page_count
    when 'CHAPTER' then work_record.chapter_count
    when 'PERCENT' then 100
  end;

  if maximum_progress is not null and p_new_value > maximum_progress then
    raise exception 'O progresso não pode superar o total da obra'
      using errcode = '22023';
  end if;

  if
    p_new_value < work_record.current_progress
    and p_event_type <> 'CORRECTION'
  then
    raise exception 'Uma redução exige correção explícita'
      using errcode = '22023';
  end if;

  insert into public.progress_events (
    owner_id,
    work_id,
    event_type,
    previous_value,
    new_value
  )
  values (
    current_owner_id,
    work_record.id,
    p_event_type,
    work_record.current_progress,
    p_new_value
  );

  update public.works
  set current_progress = p_new_value
  where id = work_record.id and owner_id = current_owner_id;

  return p_new_value;
end;
$$;

revoke all on function public.record_work_progress(
  uuid,
  numeric,
  public.progress_event_type,
  numeric
) from public, anon;

grant execute on function public.record_work_progress(
  uuid,
  numeric,
  public.progress_event_type,
  numeric
) to authenticated;
