begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(35);
create function pg_temp.update_work_title(target_id uuid, new_title text)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  affected_rows bigint;
begin
  update public.works set title = new_title where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create function pg_temp.delete_work(target_id uuid)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  affected_rows bigint;
begin
  delete from public.works where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create function pg_temp.update_profile_name(target_id uuid, new_name text)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  affected_rows bigint;
begin
  update public.profiles set display_name = new_name where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-00000000000a', 'reader-a@example.test', '{"display_name":"Leitor A"}'::jsonb),
  ('00000000-0000-4000-8000-00000000000b', 'reader-b@example.test', '{"display_name":"Leitor B"}'::jsonb);

insert into public.works (id, owner_id, type, title, isbn_13, page_count, progress_unit)
values
  (
    '10000000-0000-4000-8000-00000000000a',
    '00000000-0000-4000-8000-00000000000a',
    'BOOK',
    'Obra A',
    '9781234567890',
    100,
    'PAGE'
  ),
  (
    '10000000-0000-4000-8000-00000000000b',
    '00000000-0000-4000-8000-00000000000b',
    'BOOK',
    'Obra B',
    '9781234567890',
    100,
    'PAGE'
  );

insert into public.contributors (id, owner_id, name)
values
  ('20000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000a', 'Autor A'),
  ('20000000-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-00000000000b', 'Autor B');

insert into public.work_contributors (owner_id, work_id, contributor_id)
values
  (
    '00000000-0000-4000-8000-00000000000a',
    '10000000-0000-4000-8000-00000000000a',
    '20000000-0000-4000-8000-00000000000a'
  ),
  (
    '00000000-0000-4000-8000-00000000000b',
    '10000000-0000-4000-8000-00000000000b',
    '20000000-0000-4000-8000-00000000000b'
  );

insert into public.work_genres (owner_id, work_id, genre)
values
  ('00000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-00000000000a', 'Ficção'),
  ('00000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-00000000000b', 'História');

insert into public.work_external_sources (id, owner_id, work_id, provider, external_id)
values
  (
    '90000000-0000-4000-8000-00000000000a',
    '00000000-0000-4000-8000-00000000000a',
    '10000000-0000-4000-8000-00000000000a',
    'GOOGLE_BOOKS',
    'google-a'
  ),
  (
    '90000000-0000-4000-8000-00000000000b',
    '00000000-0000-4000-8000-00000000000b',
    '10000000-0000-4000-8000-00000000000b',
    'GOOGLE_BOOKS',
    'google-b'
  );

insert into public.reading_lists (id, owner_id, name)
values
  ('30000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000a', 'Lista A'),
  ('30000000-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-00000000000b', 'Lista B');

insert into public.reading_list_items (owner_id, list_id, work_id)
values
  (
    '00000000-0000-4000-8000-00000000000a',
    '30000000-0000-4000-8000-00000000000a',
    '10000000-0000-4000-8000-00000000000a'
  ),
  (
    '00000000-0000-4000-8000-00000000000b',
    '30000000-0000-4000-8000-00000000000b',
    '10000000-0000-4000-8000-00000000000b'
  );

insert into public.reading_sessions (
  id,
  owner_id,
  work_id,
  occurred_on,
  duration_seconds,
  progress_unit,
  start_position,
  end_position
)
values
  (
    '40000000-0000-4000-8000-00000000000a',
    '00000000-0000-4000-8000-00000000000a',
    '10000000-0000-4000-8000-00000000000a',
    current_date,
    600,
    'PAGE',
    0,
    10
  ),
  (
    '40000000-0000-4000-8000-00000000000b',
    '00000000-0000-4000-8000-00000000000b',
    '10000000-0000-4000-8000-00000000000b',
    current_date,
    900,
    'PAGE',
    0,
    15
  );

insert into public.progress_events (
  id,
  owner_id,
  work_id,
  session_id,
  event_type,
  previous_value,
  new_value
)
values
  (
    '50000000-0000-4000-8000-00000000000a',
    '00000000-0000-4000-8000-00000000000a',
    '10000000-0000-4000-8000-00000000000a',
    '40000000-0000-4000-8000-00000000000a',
    'UPDATE',
    0,
    10
  ),
  (
    '50000000-0000-4000-8000-00000000000b',
    '00000000-0000-4000-8000-00000000000b',
    '10000000-0000-4000-8000-00000000000b',
    '40000000-0000-4000-8000-00000000000b',
    'UPDATE',
    0,
    15
  );

insert into public.reviews (id, owner_id, work_id, rating, body)
values
  (
    '60000000-0000-4000-8000-00000000000a',
    '00000000-0000-4000-8000-00000000000a',
    '10000000-0000-4000-8000-00000000000a',
    4.5,
    'Review A'
  ),
  (
    '60000000-0000-4000-8000-00000000000b',
    '00000000-0000-4000-8000-00000000000b',
    '10000000-0000-4000-8000-00000000000b',
    4,
    'Review B'
  );

insert into public.notes (id, owner_id, work_id, session_id, kind, content)
values
  (
    '70000000-0000-4000-8000-00000000000a',
    '00000000-0000-4000-8000-00000000000a',
    '10000000-0000-4000-8000-00000000000a',
    '40000000-0000-4000-8000-00000000000a',
    'NOTE',
    'Nota A'
  ),
  (
    '70000000-0000-4000-8000-00000000000b',
    '00000000-0000-4000-8000-00000000000b',
    '10000000-0000-4000-8000-00000000000b',
    '40000000-0000-4000-8000-00000000000b',
    'QUOTE',
    'Citação B'
  );

insert into public.goals (id, owner_id, metric, target_value, period_start, period_end)
values
  (
    '80000000-0000-4000-8000-00000000000a',
    '00000000-0000-4000-8000-00000000000a',
    'PAGES_READ',
    100,
    current_date,
    current_date + 30
  ),
  (
    '80000000-0000-4000-8000-00000000000b',
    '00000000-0000-4000-8000-00000000000b',
    'MINUTES_READ',
    300,
    current_date,
    current_date + 30
  );

insert into public.external_metadata_cache (provider, query_hash, normalized_response, expires_at)
values ('GOOGLE_BOOKS', 'cache-entry', '[]'::jsonb, now() + interval '1 day');

select extensions.is(
  (
    select count(*)::bigint
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relkind = 'r'
      and pg_class.relrowsecurity
  ),
  14::bigint,
  'RLS está habilitada nas 14 tabelas públicas'
);

select extensions.is(
  (
    select count(*)::bigint
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relkind = 'r'
      and pg_class.relforcerowsecurity
  ),
  14::bigint,
  'RLS está forçada nas 14 tabelas públicas'
);

select extensions.is(
  (select count(*)::bigint from pg_policies where schemaname = 'public'),
  14::bigint,
  'Somente as 14 policies planejadas foram criadas'
);

select extensions.ok(
  not exists (
    select 1
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relkind = 'r'
      and (
        has_table_privilege('anon', pg_class.oid, 'SELECT')
        or has_table_privilege('anon', pg_class.oid, 'INSERT')
        or has_table_privilege('anon', pg_class.oid, 'UPDATE')
        or has_table_privilege('anon', pg_class.oid, 'DELETE')
      )
  ),
  'O papel anon não possui privilégios nas tabelas públicas'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.external_metadata_cache', 'SELECT'),
  'O cache externo não é exposto ao papel authenticated'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.progress_events', 'SELECT')
    and not has_table_privilege('authenticated', 'public.progress_events', 'INSERT')
    and not has_table_privilege('authenticated', 'public.progress_events', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.progress_events', 'DELETE'),
  'O histórico de progresso é somente leitura para authenticated'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
set local request.jwt.claim.role = 'authenticated';

select extensions.is(
  auth.uid(),
  '00000000-0000-4000-8000-00000000000a'::uuid,
  'A identidade simulada corresponde ao usuário A'
);

select extensions.is((select count(*)::bigint from public.profiles), 1::bigint, 'A vê somente o próprio perfil');
select extensions.is((select count(*)::bigint from public.works), 1::bigint, 'A vê somente as próprias obras');
select extensions.is((select count(*)::bigint from public.contributors), 1::bigint, 'A vê somente os próprios autores');
select extensions.is(
  (select count(*)::bigint from public.work_contributors),
  1::bigint,
  'A vê somente os próprios vínculos de autoria'
);
select extensions.is((select count(*)::bigint from public.work_genres), 1::bigint, 'A vê somente os próprios gêneros');
select extensions.is(
  (select count(*)::bigint from public.work_external_sources),
  1::bigint,
  'A vê somente as próprias fontes externas'
);
select extensions.is((select count(*)::bigint from public.reading_lists), 1::bigint, 'A vê somente as próprias listas');
select extensions.is(
  (select count(*)::bigint from public.reading_list_items),
  1::bigint,
  'A vê somente os próprios itens de lista'
);
select extensions.is(
  (select count(*)::bigint from public.reading_sessions),
  1::bigint,
  'A vê somente as próprias sessões'
);
select extensions.is(
  (select count(*)::bigint from public.progress_events),
  1::bigint,
  'A vê somente o próprio histórico de progresso'
);
select extensions.is((select count(*)::bigint from public.reviews), 1::bigint, 'A vê somente as próprias avaliações');
select extensions.is((select count(*)::bigint from public.notes), 1::bigint, 'A vê somente as próprias notas');
select extensions.is((select count(*)::bigint from public.goals), 1::bigint, 'A vê somente as próprias metas');

select extensions.lives_ok(
  $$
    insert into public.works (id, owner_id, type, title, progress_unit)
    values (
      '10000000-0000-4000-8000-00000000000c',
      '00000000-0000-4000-8000-00000000000a',
      'EBOOK',
      'Nova obra de A',
      'PERCENT'
    )
  $$,
  'A pode inserir uma obra própria'
);

select extensions.throws_ok(
  $$
    insert into public.works (owner_id, type, title, progress_unit)
    values (
      '00000000-0000-4000-8000-00000000000b',
      'EBOOK',
      'Tentativa em nome de B',
      'PERCENT'
    )
  $$,
  '42501',
  null,
  'A não pode inserir uma obra para B'
);

select extensions.is(
  pg_temp.update_work_title(
    '10000000-0000-4000-8000-00000000000b',
    'Alterada por A'
  ),
  0::bigint,
  'A não pode alterar uma obra de B'
);

select extensions.is(
  pg_temp.delete_work('10000000-0000-4000-8000-00000000000b'),
  0::bigint,
  'A não pode excluir uma obra de B'
);

select extensions.is(
  pg_temp.update_profile_name(
    '00000000-0000-4000-8000-00000000000b',
    'Alterado por A'
  ),
  0::bigint,
  'A não pode alterar o perfil de B'
);

select extensions.throws_ok(
  $$
    insert into public.reading_list_items (owner_id, list_id, work_id)
    values (
      '00000000-0000-4000-8000-00000000000b',
      '30000000-0000-4000-8000-00000000000b',
      '10000000-0000-4000-8000-00000000000b'
    )
  $$,
  '42501',
  null,
  'A não pode forjar owner_id de B em uma associação'
);

select extensions.throws_ok(
  $$
    insert into public.reading_list_items (owner_id, list_id, work_id)
    values (
      '00000000-0000-4000-8000-00000000000a',
      '30000000-0000-4000-8000-00000000000a',
      '10000000-0000-4000-8000-00000000000b'
    )
  $$,
  '23503',
  null,
  'A não pode associar uma obra de B à própria lista'
);

select extensions.throws_ok(
  $$ select * from public.external_metadata_cache $$,
  '42501',
  null,
  'A não pode consultar o cache externo'
);

select extensions.throws_ok(
  $$
    insert into public.progress_events (owner_id, work_id, event_type, previous_value, new_value)
    values (
      '00000000-0000-4000-8000-00000000000a',
      '10000000-0000-4000-8000-00000000000a',
      'UPDATE',
      10,
      20
    )
  $$,
  '42501',
  null,
  'A não pode inserir eventos de progresso diretamente'
);

select extensions.throws_ok(
  $$
    update public.progress_events
    set new_value = 20
    where id = '50000000-0000-4000-8000-00000000000a'
  $$,
  '42501',
  null,
  'A não pode alterar o histórico de progresso'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';

select extensions.is(
  auth.uid(),
  '00000000-0000-4000-8000-00000000000b'::uuid,
  'A identidade simulada pode ser trocada para o usuário B'
);

select extensions.is((select count(*)::bigint from public.works), 1::bigint, 'B vê somente a própria obra');

select extensions.is(
  pg_temp.update_work_title(
    '10000000-0000-4000-8000-00000000000a',
    'Alterada por B'
  ),
  0::bigint,
  'B não pode alterar uma obra de A'
);

reset role;

select extensions.is(
  (select title from public.works where id = '10000000-0000-4000-8000-00000000000b'),
  'Obra B',
  'A obra de B permaneceu inalterada'
);

select extensions.is(
  (
    select count(*)::bigint
    from public.works
    where id = '10000000-0000-4000-8000-00000000000c'
      and owner_id = '00000000-0000-4000-8000-00000000000a'
  ),
  1::bigint,
  'A inserção autorizada de A foi persistida na transação de teste'
);

select * from extensions.finish();

rollback;
