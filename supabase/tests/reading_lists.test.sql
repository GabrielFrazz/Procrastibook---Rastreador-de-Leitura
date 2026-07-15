begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(16);

select extensions.ok(
  not has_function_privilege('anon', 'public.create_reading_list(text,text)', 'EXECUTE'),
  'Anon não pode criar listas'
);

select extensions.ok(
  has_function_privilege('authenticated', 'public.create_reading_list(text,text)', 'EXECUTE'),
  'Authenticated pode criar listas'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '00000000-0000-4000-8000-00000000000e',
    'lists-a@example.test',
    '{"display_name":"Listas A"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-00000000000f',
    'lists-b@example.test',
    '{"display_name":"Listas B"}'::jsonb
  );

insert into public.works (id, owner_id, type, title, progress_unit)
values
  (
    '10000000-0000-4000-8000-00000000000e',
    '00000000-0000-4000-8000-00000000000e',
    'BOOK',
    'Obra de A',
    'PAGE'
  ),
  (
    '10000000-0000-4000-8000-00000000000f',
    '00000000-0000-4000-8000-00000000000f',
    'BOOK',
    'Obra de B',
    'PAGE'
  );

insert into public.reading_lists (id, owner_id, name)
values (
  '30000000-0000-4000-8000-00000000000f',
  '00000000-0000-4000-8000-00000000000f',
  'Lista de B'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$ select public.create_reading_list('  Férias  ', '  Para a viagem  ') $$,
  'A função cria uma lista pessoal'
);

select extensions.is(
  (select name::text from public.reading_lists where owner_id = auth.uid()),
  'Férias',
  'O nome da lista é normalizado'
);

select extensions.is(
  (select description from public.reading_lists where owner_id = auth.uid()),
  'Para a viagem',
  'A descrição da lista é normalizada'
);

select extensions.throws_ok(
  $$ select public.create_reading_list('fÉrIaS') $$,
  '23505',
  null,
  'Nomes repetidos sem distinção de maiúsculas são bloqueados'
);

select extensions.lives_ok(
  $$
    select public.add_work_to_reading_list(
      (select id from public.reading_lists where owner_id = auth.uid()),
      '10000000-0000-4000-8000-00000000000e'
    )
  $$,
  'A pode adicionar a própria obra à lista'
);

select extensions.throws_ok(
  $$
    select public.add_work_to_reading_list(
      (select id from public.reading_lists where owner_id = auth.uid()),
      '10000000-0000-4000-8000-00000000000e'
    )
  $$,
  '23505',
  null,
  'A mesma obra não pode ser adicionada duas vezes à lista'
);

select extensions.throws_ok(
  $$
    select public.add_work_to_reading_list(
      (select id from public.reading_lists where owner_id = auth.uid()),
      '10000000-0000-4000-8000-00000000000f'
    )
  $$,
  '23503',
  null,
  'A não pode adicionar a obra de B à própria lista'
);

select extensions.is(
  public.remove_work_from_reading_list(
    '30000000-0000-4000-8000-00000000000f',
    '10000000-0000-4000-8000-00000000000f'
  ),
  false,
  'A não pode remover uma obra da lista de B'
);

select extensions.is(
  public.delete_reading_list('30000000-0000-4000-8000-00000000000f'),
  false,
  'A não pode excluir a lista de B'
);

select extensions.ok(
  public.remove_work_from_reading_list(
    (select id from public.reading_lists where owner_id = auth.uid()),
    '10000000-0000-4000-8000-00000000000e'
  ),
  'A pode remover uma obra da lista'
);

select extensions.is(
  (select count(*)::bigint from public.reading_list_items),
  0::bigint,
  'A associação é removida'
);

select public.add_work_to_reading_list(
  (select id from public.reading_lists where owner_id = auth.uid()),
  '10000000-0000-4000-8000-00000000000e'
);

select extensions.ok(
  public.delete_reading_list(
    (select id from public.reading_lists where owner_id = auth.uid())
  ),
  'A pode excluir a própria lista'
);

select extensions.is(
  (select count(*)::bigint from public.reading_list_items),
  0::bigint,
  'Excluir a lista remove suas associações'
);

select extensions.is(
  (select count(*)::bigint from public.works where id = '10000000-0000-4000-8000-00000000000e'),
  1::bigint,
  'Excluir a lista preserva a obra'
);

select * from extensions.finish();

rollback;
