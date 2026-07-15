begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(16);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_work_progress(uuid,numeric,public.progress_event_type,numeric)',
    'EXECUTE'
  ),
  'Anon não pode registrar progresso'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_work_progress(uuid,numeric,public.progress_event_type,numeric)',
    'EXECUTE'
  ),
  'Authenticated pode registrar progresso'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '00000000-0000-4000-8000-000000000010',
    'progress-a@example.test',
    '{"display_name":"Progresso A"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'progress-b@example.test',
    '{"display_name":"Progresso B"}'::jsonb
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
values
  (
    '10000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000010',
    'BOOK',
    'Obra paginada de A',
    100,
    'PAGE',
    10
  ),
  (
    '10000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    'ARTICLE',
    'Obra percentual de A',
    null,
    'PERCENT',
    50
  ),
  (
    '10000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000010',
    'EBOOK',
    'Obra sem total de A',
    null,
    'PAGE',
    0
  ),
  (
    '10000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000011',
    'BOOK',
    'Obra de B',
    80,
    'PAGE',
    5
  );

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000010';
set local request.jwt.claim.role = 'authenticated';

select extensions.throws_ok(
  $$
    update public.works
    set current_progress = 20
    where id = '10000000-0000-4000-8000-000000000010'
  $$,
  '42501',
  null,
  'Authenticated não altera current_progress diretamente'
);

select extensions.is(
  public.record_work_progress(
    '10000000-0000-4000-8000-000000000010',
    30,
    'UPDATE',
    10
  ),
  30::numeric,
  'A atualização retorna o novo progresso'
);

select extensions.is(
  (
    select current_progress
    from public.works
    where id = '10000000-0000-4000-8000-000000000010'
  ),
  30::numeric,
  'A obra é atualizada na mesma operação'
);

select extensions.is(
  (
    select count(*)::bigint
    from public.progress_events
    where work_id = '10000000-0000-4000-8000-000000000010'
  ),
  1::bigint,
  'A operação cria um evento de progresso'
);

select extensions.throws_ok(
  $$
    select public.record_work_progress(
      '10000000-0000-4000-8000-000000000010',
      40,
      'UPDATE',
      10
    )
  $$,
  '40001',
  null,
  'Uma atualização baseada em valor obsoleto é rejeitada'
);

select extensions.throws_ok(
  $$
    select public.record_work_progress(
      '10000000-0000-4000-8000-000000000010',
      20,
      'UPDATE',
      30
    )
  $$,
  '22023',
  null,
  'Uma redução comum é rejeitada'
);

select extensions.is(
  public.record_work_progress(
    '10000000-0000-4000-8000-000000000010',
    20,
    'CORRECTION',
    30
  ),
  20::numeric,
  'Uma correção explícita pode reduzir o progresso'
);

select extensions.is(
  (
    select event_type
    from public.progress_events
    where work_id = '10000000-0000-4000-8000-000000000010'
      and new_value = 20
    limit 1
  ),
  'CORRECTION'::public.progress_event_type,
  'A redução é auditada como correção'
);

select extensions.throws_ok(
  $$
    select public.record_work_progress(
      '10000000-0000-4000-8000-000000000010',
      101,
      'UPDATE',
      20
    )
  $$,
  '22023',
  null,
  'Páginas não podem superar o total conhecido'
);

select extensions.throws_ok(
  $$
    select public.record_work_progress(
      '10000000-0000-4000-8000-000000000011',
      101,
      'UPDATE',
      50
    )
  $$,
  '22023',
  null,
  'Percentual não pode superar cem'
);

select extensions.throws_ok(
  $$
    select public.record_work_progress(
      '10000000-0000-4000-8000-000000000010',
      -1,
      'CORRECTION',
      20
    )
  $$,
  '22023',
  null,
  'Progresso negativo é rejeitado'
);

select extensions.is(
  public.record_work_progress(
    '10000000-0000-4000-8000-000000000012',
    250,
    'UPDATE',
    0
  ),
  250::numeric,
  'Obra sem total aceita progresso positivo'
);

select extensions.throws_ok(
  $$
    select public.record_work_progress(
      '10000000-0000-4000-8000-000000000012',
      250,
      'UPDATE',
      250
    )
  $$,
  '22023',
  null,
  'Atualização sem mudança é rejeitada'
);

select extensions.throws_ok(
  $$
    select public.record_work_progress(
      '10000000-0000-4000-8000-000000000013',
      10,
      'UPDATE',
      5
    )
  $$,
  '42501',
  null,
  'A não altera progresso da obra de B'
);

select * from extensions.finish();

rollback;
