begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(10);

select extensions.ok(
  not exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name = 'create_manual_work'
      and grantee in ('PUBLIC', 'anon')
      and privilege_type = 'EXECUTE'
  ),
  'A criação manual não pode ser executada por anon'
);

select extensions.ok(
  exists (
    select 1
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name = 'create_manual_work'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
  ),
  'Authenticated pode executar a criação manual'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '00000000-0000-4000-8000-00000000000c',
  'manual-work@example.test',
  '{"display_name":"Cadastro Manual"}'::jsonb
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$
    select public.create_manual_work(
      p_type => 'BOOK',
      p_title => 'Obra criada pela função',
      p_subtitle => null,
      p_description => 'Descrição segura',
      p_publisher => 'Editora Teste',
      p_published_year => 2026,
      p_language => 'pt-BR',
      p_isbn_13 => '9781234567890',
      p_page_count => 200,
      p_chapter_count => null,
      p_progress_unit => 'PAGE',
      p_status => 'FINISHED',
      p_cover_path => '00000000-0000-4000-8000-00000000000c/capa.webp',
      p_started_at => '2026-07-01T12:00:00Z',
      p_authors => array['Autora Principal', 'Coautor'],
      p_genres => array['Ficção', 'Teste']
    )
  $$,
  'A função cria uma obra e seus relacionamentos'
);

select extensions.is(
  (
    select owner_id
    from public.works
    where title = 'Obra criada pela função'
  ),
  '00000000-0000-4000-8000-00000000000c'::uuid,
  'A obra pertence ao usuário autenticado'
);

select extensions.is(
  (
    select current_progress
    from public.works
    where title = 'Obra criada pela função'
  ),
  200::numeric,
  'Uma obra finalizada recebe o total conhecido como progresso'
);

select extensions.is(
  (select count(*)::bigint from public.contributors),
  2::bigint,
  'Os autores são criados dentro da mesma transação'
);

select extensions.is(
  (
    select array_agg(contributors.name order by work_contributors.position)
    from public.work_contributors
    join public.contributors on contributors.id = work_contributors.contributor_id
  ),
  array['Autora Principal', 'Coautor']::text[],
  'A ordem informada dos autores é preservada'
);

select extensions.is(
  (select count(*)::bigint from public.work_genres),
  2::bigint,
  'Os gêneros são associados dentro da mesma transação'
);

select extensions.throws_ok(
  $$
    select public.create_manual_work(
      p_type => 'BOOK',
      p_title => 'Duplicata bloqueada',
      p_subtitle => null,
      p_description => null,
      p_publisher => null,
      p_published_year => null,
      p_language => null,
      p_isbn_13 => '9781234567890',
      p_page_count => 100,
      p_chapter_count => null,
      p_progress_unit => 'PAGE',
      p_status => 'WANT_TO_READ',
      p_cover_path => null,
      p_started_at => null,
      p_authors => array['Outra Autora'],
      p_genres => array[]::text[]
    )
  $$,
  '23505',
  null,
  'ISBN duplicado do mesmo usuário é bloqueado'
);

select extensions.throws_ok(
  $$
    select public.create_manual_work(
      p_type => 'BOOK',
      p_title => 'Capa de outro usuário',
      p_progress_unit => 'PAGE',
      p_status => 'WANT_TO_READ',
      p_authors => array['Autora'],
      p_cover_path => '00000000-0000-4000-8000-000000000099/capa.webp'
    )
  $$,
  '42501',
  null,
  'Uma obra não pode referenciar a capa de outro usuário'
);

select * from extensions.finish();

rollback;
