-- Register a reading session and advance its work in the same transaction.

create function public.record_reading_session(
  p_work_id uuid,
  p_occurred_on date,
  p_duration_seconds integer,
  p_end_position numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  work_record record;
  maximum_progress numeric;
  session_id uuid;
  normalized_notes text;
begin
  if current_owner_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;

  if
    p_work_id is null
    or p_occurred_on is null
    or p_duration_seconds is null
    or p_end_position is null
  then
    raise exception 'Dados obrigatórios ausentes' using errcode = '22023';
  end if;

  if p_duration_seconds <= 0 or p_duration_seconds > 86400 then
    raise exception 'Duração inválida' using errcode = '22023';
  end if;

  if
    p_end_position <= 0
    or p_end_position > 99999999.99
    or round(p_end_position, 2) <> p_end_position
  then
    raise exception 'Posição final inválida' using errcode = '22023';
  end if;

  normalized_notes := nullif(btrim(p_notes), '');

  if normalized_notes is not null and length(normalized_notes) > 2000 then
    raise exception 'Anotação muito longa' using errcode = '22023';
  end if;

  select
    id,
    progress_unit,
    current_progress,
    page_count,
    chapter_count
  into work_record
  from public.works
  where id = p_work_id and owner_id = current_owner_id
  for update;

  if not found then
    raise exception 'Obra não encontrada' using errcode = 'P0002';
  end if;

  maximum_progress := case work_record.progress_unit
    when 'PAGE' then work_record.page_count
    when 'CHAPTER' then work_record.chapter_count
    when 'PERCENT' then 100
  end;

  if p_end_position <= work_record.current_progress then
    raise exception 'A posição final deve superar o progresso atual'
      using errcode = '22023';
  end if;

  if maximum_progress is not null and p_end_position > maximum_progress then
    raise exception 'A posição final não pode superar o total da obra'
      using errcode = '22023';
  end if;

  insert into public.reading_sessions (
    owner_id,
    work_id,
    occurred_on,
    duration_seconds,
    progress_unit,
    start_position,
    end_position,
    notes
  )
  values (
    current_owner_id,
    work_record.id,
    p_occurred_on,
    p_duration_seconds,
    work_record.progress_unit,
    work_record.current_progress,
    p_end_position,
    normalized_notes
  )
  returning id into session_id;

  insert into public.progress_events (
    owner_id,
    work_id,
    session_id,
    event_type,
    previous_value,
    new_value
  )
  values (
    current_owner_id,
    work_record.id,
    session_id,
    'UPDATE',
    work_record.current_progress,
    p_end_position
  );

  update public.works
  set current_progress = p_end_position
  where id = work_record.id and owner_id = current_owner_id;

  return session_id;
end;
$$;

revoke all on function public.record_reading_session(
  uuid,
  date,
  integer,
  numeric,
  text
) from public, anon;

grant execute on function public.record_reading_session(
  uuid,
  date,
  integer,
  numeric,
  text
) to authenticated;
