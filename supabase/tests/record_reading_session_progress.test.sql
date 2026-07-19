begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(9);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '00000000-0000-4000-8000-000000000040',
    'session-progress-a@example.test',
    '{"display_name":"Sessão Progresso A"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000041',
    'session-progress-b@example.test',
    '{"display_name":"Sessão Progresso B"}'::jsonb
  );

insert into public.works (
  id,
  owner_id,
  type,
  title,
  page_count,
  progress_unit,
  current_progress
)
values (
  '10000000-0000-4000-8000-000000000040',
  '00000000-0000-4000-8000-000000000040',
  'BOOK',
  'Obra com progresso por sessão',
  200,
  'PAGE',
  10
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000040';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$
    select public.record_reading_session(
      p_work_id := '10000000-0000-4000-8000-000000000040',
      p_occurred_on := '2026-07-15',
      p_duration_seconds := 2700,
      p_end_position := 42,
      p_notes := 'Sessão que avança a obra'
    )
  $$,
  'A registra sessão e progresso em uma operação'
);

select extensions.is(
  (
    select current_progress
    from public.works
    where id = '10000000-0000-4000-8000-000000000040'
  ),
  42::numeric,
  'A obra assume a posição final da sessão'
);

select extensions.is(
  (
    select start_position
    from public.reading_sessions
    where work_id = '10000000-0000-4000-8000-000000000040'
  ),
  10::numeric,
  'A sessão deriva a posição inicial do progresso anterior'
);

select extensions.is(
  (
    select end_position
    from public.reading_sessions
    where work_id = '10000000-0000-4000-8000-000000000040'
  ),
  42::numeric,
  'A sessão conserva a posição final informada'
);

select extensions.is(
  (
    select progress_unit
    from public.reading_sessions
    where work_id = '10000000-0000-4000-8000-000000000040'
  ),
  'PAGE'::public.progress_unit,
  'A sessão deriva a unidade da obra'
);

select extensions.is(
  (
    select count(*)::bigint
    from public.progress_events
    where work_id = '10000000-0000-4000-8000-000000000040'
      and previous_value = 10
      and new_value = 42
      and session_id is not null
  ),
  1::bigint,
  'O avanço fica ligado à sessão no histórico'
);

select extensions.throws_ok(
  $$
    select public.record_reading_session(
      p_work_id := '10000000-0000-4000-8000-000000000040',
      p_occurred_on := '2026-07-16',
      p_duration_seconds := 600,
      p_end_position := 40
    )
  $$,
  '22023',
  null,
  'A posição final não pode reduzir o progresso'
);

select extensions.throws_ok(
  $$
    select public.record_reading_session(
      p_work_id := '10000000-0000-4000-8000-000000000040',
      p_occurred_on := '2026-07-16',
      p_duration_seconds := 600,
      p_end_position := 201
    )
  $$,
  '22023',
  null,
  'A posição final não pode superar o total da obra'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000041';

select extensions.throws_ok(
  $$
    select public.record_reading_session(
      p_work_id := '10000000-0000-4000-8000-000000000040',
      p_occurred_on := '2026-07-16',
      p_duration_seconds := 600,
      p_end_position := 50
    )
  $$,
  'P0002',
  null,
  'Outro usuário não registra sessão na obra de A'
);

select * from extensions.finish();

rollback;
