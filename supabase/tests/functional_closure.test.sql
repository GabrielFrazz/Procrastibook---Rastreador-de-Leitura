begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(11);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.update_owned_work(uuid,public.work_type,text,public.reading_status,text[],text,text,text,integer,text,text,text,text,integer,integer,text[])',
    'EXECUTE'
  ),
  'Authenticated pode editar as próprias obras'
);

select extensions.ok(
  not has_function_privilege('anon', 'public.delete_owned_work(uuid)', 'EXECUTE'),
  'Anon não pode excluir obras'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-000000000081', 'closure-a@example.test', '{"display_name":"Leitor A"}'::jsonb),
  ('00000000-0000-4000-8000-000000000082', 'closure-b@example.test', '{"display_name":"Leitor B"}'::jsonb);

insert into public.works (
  id, owner_id, type, title, page_count, progress_unit, current_progress
)
values
  (
    '10000000-0000-4000-8000-000000000081',
    '00000000-0000-4000-8000-000000000081',
    'BOOK',
    'Obra A',
    100,
    'PAGE',
    20
  ),
  (
    '10000000-0000-4000-8000-000000000082',
    '00000000-0000-4000-8000-000000000082',
    'BOOK',
    'Obra B',
    90,
    'PAGE',
    10
  );

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000081';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$
    select public.update_owned_work(
      p_work_id => '10000000-0000-4000-8000-000000000081',
      p_type => 'BOOK',
      p_title => 'Obra A editada',
      p_status => 'FINISHED',
      p_authors => array['Autora A'],
      p_page_count => 120,
      p_genres => array['Ficção']
    )
  $$,
  'A edita a própria obra'
);

select extensions.is(
  (select title from public.works where id = '10000000-0000-4000-8000-000000000081'),
  'Obra A editada',
  'A edição altera os metadados'
);

select extensions.is(
  (select current_progress from public.works where id = '10000000-0000-4000-8000-000000000081'),
  120::numeric,
  'Finalizar preenche o progresso total conhecido'
);

select extensions.is(
  (select count(*)::bigint from public.progress_events where work_id = '10000000-0000-4000-8000-000000000081'),
  1::bigint,
  'A conclusão automática fica registrada no histórico'
);

select extensions.is(
  (select count(*)::bigint from public.work_contributors where work_id = '10000000-0000-4000-8000-000000000081'),
  1::bigint,
  'Autores são atualizados na mesma operação'
);

select extensions.throws_ok(
  $$
    select public.update_owned_work(
      p_work_id => '10000000-0000-4000-8000-000000000082',
      p_type => 'BOOK',
      p_title => 'Tentativa indevida',
      p_status => 'READING',
      p_authors => array['Autor B']
    )
  $$,
  '42501',
  null,
  'A não edita a obra de B'
);

select extensions.throws_ok(
  $$ select public.delete_owned_work('10000000-0000-4000-8000-000000000082') $$,
  '42501',
  null,
  'A não exclui a obra de B'
);

select extensions.throws_ok(
  $$
    update public.profiles
    set avatar_path = '00000000-0000-4000-8000-000000000082/avatar.webp'
    where id = '00000000-0000-4000-8000-000000000081'
  $$,
  '23514',
  null,
  'O perfil não aceita caminho de avatar de outro usuário'
);

select extensions.lives_ok(
  $$ select public.delete_owned_work('10000000-0000-4000-8000-000000000081') $$,
  'A exclui a própria obra'
);

select * from extensions.finish();

rollback;
