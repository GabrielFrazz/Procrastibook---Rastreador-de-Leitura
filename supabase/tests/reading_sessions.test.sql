begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(14);

create function pg_temp.update_session_notes(target_id uuid, new_notes text)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  affected_rows bigint;
begin
  update public.reading_sessions set notes = new_notes where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create function pg_temp.delete_session(target_id uuid)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  affected_rows bigint;
begin
  delete from public.reading_sessions where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '00000000-0000-4000-8000-000000000020',
    'session-a@example.test',
    '{"display_name":"Sessão A"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'session-b@example.test',
    '{"display_name":"Sessão B"}'::jsonb
  );

insert into public.works (
  id,
  owner_id,
  type,
  title,
  page_count,
  progress_unit
)
values
  (
    '10000000-0000-4000-8000-000000000020',
    '00000000-0000-4000-8000-000000000020',
    'BOOK',
    'Obra de sessões A',
    200,
    'PAGE'
  ),
  (
    '10000000-0000-4000-8000-000000000021',
    '00000000-0000-4000-8000-000000000021',
    'MANGA',
    'Obra de sessões B',
    null,
    'CHAPTER'
  );

update public.works
set chapter_count = 30
where id = '10000000-0000-4000-8000-000000000021';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000020';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$
    insert into public.reading_sessions (
      id,
      owner_id,
      work_id,
      occurred_on,
      duration_seconds,
      progress_unit,
      start_position,
      end_position,
      notes
    ) values (
      '40000000-0000-4000-8000-000000000020',
      '00000000-0000-4000-8000-000000000020',
      '10000000-0000-4000-8000-000000000020',
      '2026-07-15',
      2700,
      'PAGE',
      10,
      42,
      'Sessão válida'
    )
  $$,
  'A registra uma sessão válida na própria obra'
);

select extensions.is(
  (select count(*)::bigint from public.reading_sessions),
  1::bigint,
  'A consulta somente sua sessão'
);

select extensions.is(
  (
    select progress_unit
    from public.reading_sessions
    where id = '40000000-0000-4000-8000-000000000020'
  ),
  'PAGE'::public.progress_unit,
  'A sessão conserva a unidade da obra'
);

select extensions.throws_ok(
  $$
    insert into public.reading_sessions (
      owner_id, work_id, duration_seconds, progress_unit
    ) values (
      '00000000-0000-4000-8000-000000000020',
      '10000000-0000-4000-8000-000000000020',
      0,
      'PAGE'
    )
  $$,
  '23514',
  null,
  'Duração igual a zero é rejeitada'
);

select extensions.throws_ok(
  $$
    insert into public.reading_sessions (
      owner_id, work_id, duration_seconds, progress_unit
    ) values (
      '00000000-0000-4000-8000-000000000020',
      '10000000-0000-4000-8000-000000000020',
      600,
      'CHAPTER'
    )
  $$,
  '23514',
  null,
  'Unidade diferente da obra é rejeitada'
);

select extensions.throws_ok(
  $$
    insert into public.reading_sessions (
      owner_id,
      work_id,
      duration_seconds,
      progress_unit,
      start_position,
      end_position
    ) values (
      '00000000-0000-4000-8000-000000000020',
      '10000000-0000-4000-8000-000000000020',
      600,
      'PAGE',
      190,
      201
    )
  $$,
  '23514',
  null,
  'Posição acima do total conhecido é rejeitada'
);

select extensions.throws_ok(
  $$
    insert into public.reading_sessions (
      owner_id,
      work_id,
      duration_seconds,
      progress_unit,
      start_position,
      end_position
    ) values (
      '00000000-0000-4000-8000-000000000020',
      '10000000-0000-4000-8000-000000000020',
      600,
      'PAGE',
      50,
      40
    )
  $$,
  '23514',
  null,
  'Posição final menor que a inicial é rejeitada'
);

select extensions.throws_ok(
  $$
    insert into public.reading_sessions (
      owner_id, work_id, duration_seconds, progress_unit
    ) values (
      '00000000-0000-4000-8000-000000000021',
      '10000000-0000-4000-8000-000000000021',
      900,
      'CHAPTER'
    )
  $$,
  '42501',
  null,
  'A não registra sessão como B'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000021';

select extensions.is(
  (select count(*)::bigint from public.reading_sessions),
  0::bigint,
  'B não lê a sessão de A'
);

select extensions.is(
  pg_temp.update_session_notes(
    '40000000-0000-4000-8000-000000000020',
    'Alterada por B'
  ),
  0::bigint,
  'B não altera a sessão de A'
);

select extensions.is(
  pg_temp.delete_session('40000000-0000-4000-8000-000000000020'),
  0::bigint,
  'B não exclui a sessão de A'
);

select extensions.lives_ok(
  $$
    insert into public.reading_sessions (
      id,
      owner_id,
      work_id,
      occurred_on,
      duration_seconds,
      progress_unit,
      start_position,
      end_position
    ) values (
      '40000000-0000-4000-8000-000000000021',
      '00000000-0000-4000-8000-000000000021',
      '10000000-0000-4000-8000-000000000021',
      '2026-07-15',
      900,
      'CHAPTER',
      2,
      5
    )
  $$,
  'B registra sessão na própria obra e unidade'
);

select extensions.is(
  (select count(*)::bigint from public.reading_sessions),
  1::bigint,
  'B consulta somente sua própria sessão'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000020';

select extensions.is(
  (
    select notes
    from public.reading_sessions
    where id = '40000000-0000-4000-8000-000000000020'
  ),
  'Sessão válida'::text,
  'A sessão de A permaneceu inalterada'
);

select * from extensions.finish();

rollback;
