begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(9);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.create_catalog_work(public.work_type,text,public.progress_unit,public.reading_status,text[],public.external_provider,text,text,text,text,integer,text,text,text,integer,integer,text,text,timestamptz,text[])',
    'EXECUTE'
  ),
  'Anon não pode executar importação de catálogo'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.create_catalog_work(public.work_type,text,public.progress_unit,public.reading_status,text[],public.external_provider,text,text,text,text,integer,text,text,text,integer,integer,text,text,timestamptz,text[])',
    'EXECUTE'
  ),
  'Authenticated pode executar importação de catálogo'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '00000000-0000-4000-8000-00000000000d',
  'catalog-work@example.test',
  '{"display_name":"Importação Catálogo"}'::jsonb
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$
    select public.create_catalog_work(
      p_type => 'BOOK',
      p_title => 'Dom Casmurro',
      p_progress_unit => 'PAGE',
      p_status => 'WANT_TO_READ',
      p_authors => array['Machado de Assis'],
      p_provider => 'OPEN_LIBRARY',
      p_external_id => '/works/OL45804W',
      p_isbn_10 => '8535902775',
      p_isbn_13 => '9788535902778',
      p_page_count => 256,
      p_cover_external_url => 'https://covers.openlibrary.org/b/id/8231856-L.jpg?default=false',
      p_genres => array['Clássico']
    )
  $$,
  'A função importa obra e metadados em uma transação'
);

select extensions.is(
  (select isbn_10 from public.works where title = 'Dom Casmurro'),
  '8535902775',
  'ISBN-10 normalizado é preservado'
);

select extensions.is(
  (select cover_external_url from public.works where title = 'Dom Casmurro'),
  'https://covers.openlibrary.org/b/id/8231856-L.jpg?default=false',
  'Capa externa confiável é preservada'
);

select extensions.is(
  (
    select count(*)::bigint
    from public.work_external_sources
    where provider = 'OPEN_LIBRARY' and external_id = '/works/OL45804W'
  ),
  1::bigint,
  'A referência externa pertence à obra importada'
);

select extensions.is(
  (
    select normalized_snapshot ->> 'title'
    from public.work_external_sources
    where external_id = '/works/OL45804W'
  ),
  'Dom Casmurro',
  'O snapshot contém somente metadados normalizados'
);

select extensions.throws_ok(
  $$
    select public.create_catalog_work(
      p_type => 'BOOK',
      p_title => 'Duplicata externa',
      p_progress_unit => 'PAGE',
      p_status => 'WANT_TO_READ',
      p_authors => array['Autor'],
      p_provider => 'OPEN_LIBRARY',
      p_external_id => '/works/OL45804W'
    )
  $$,
  '23505',
  null,
  'Referência externa duplicada do mesmo usuário é bloqueada'
);

select extensions.throws_ok(
  $$
    select public.create_catalog_work(
      p_type => 'BOOK',
      p_title => 'Capa externa inválida',
      p_progress_unit => 'PAGE',
      p_status => 'WANT_TO_READ',
      p_authors => array['Autor'],
      p_provider => 'GOOGLE_BOOKS',
      p_external_id => 'google-invalid-cover',
      p_cover_external_url => 'https://tracker.example/capa.jpg'
    )
  $$,
  '22023',
  null,
  'Capas externas fora dos provedores confiáveis são bloqueadas'
);

select * from extensions.finish();

rollback;
