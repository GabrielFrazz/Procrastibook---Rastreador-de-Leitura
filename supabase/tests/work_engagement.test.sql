begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(23);

create function pg_temp.update_review(target_id uuid, new_rating numeric)
returns bigint language plpgsql set search_path = '' as $$
declare affected_rows bigint;
begin
  update public.reviews set rating = new_rating where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create function pg_temp.delete_review(target_id uuid)
returns bigint language plpgsql set search_path = '' as $$
declare affected_rows bigint;
begin
  delete from public.reviews where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create function pg_temp.update_note(target_id uuid, new_content text)
returns bigint language plpgsql set search_path = '' as $$
declare affected_rows bigint;
begin
  update public.notes set content = new_content where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create function pg_temp.delete_note(target_id uuid)
returns bigint language plpgsql set search_path = '' as $$
declare affected_rows bigint;
begin
  delete from public.notes where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-000000000030', 'engagement-a@example.test', '{"display_name":"Engajamento A"}'::jsonb),
  ('00000000-0000-4000-8000-000000000031', 'engagement-b@example.test', '{"display_name":"Engajamento B"}'::jsonb);

insert into public.works (id, owner_id, type, title, page_count, progress_unit)
values
  ('10000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000030', 'BOOK', 'Obra A', 200, 'PAGE'),
  ('10000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031', 'BOOK', 'Obra B', 180, 'PAGE');

insert into public.reading_sessions (
  id, owner_id, work_id, occurred_on, duration_seconds, progress_unit, start_position, end_position
)
values
  ('40000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', '2026-07-15', 1200, 'PAGE', 10, 30),
  ('40000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000031', '2026-07-15', 900, 'PAGE', 5, 20);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000030';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$insert into public.reviews (id, owner_id, work_id, rating, body)
    values ('60000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', 4, 'Review de A')$$,
  'A cria uma review na própria obra'
);

select extensions.is(
  (select rating from public.reviews where id = '60000000-0000-4000-8000-000000000030'),
  4::numeric,
  'A consulta a nota salva'
);

select extensions.throws_ok(
  $$insert into public.reviews (owner_id, work_id, rating)
    values ('00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', 5)$$,
  '23505', null, 'Uma obra aceita somente uma review por usuário'
);

select extensions.throws_ok(
  $$insert into public.reviews (owner_id, work_id, rating)
    values ('00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', 0)$$,
  '23514', null, 'Nota abaixo de 1 é rejeitada'
);

select extensions.lives_ok(
  $$insert into public.notes (id, owner_id, work_id, kind, content, location_label)
    values ('50000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', 'NOTE', 'Anotação de A', 'Página 30')$$,
  'A cria uma anotação na própria obra'
);

select extensions.lives_ok(
  $$insert into public.notes (id, owner_id, work_id, session_id, kind, content)
    values ('50000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', '40000000-0000-4000-8000-000000000030', 'QUOTE', 'Citação de A')$$,
  'A vincula uma citação a uma sessão da mesma obra'
);

select extensions.is(
  (select count(*)::bigint from public.notes),
  2::bigint,
  'A consulta seus dois conteúdos'
);

select extensions.throws_ok(
  $$insert into public.notes (owner_id, work_id, kind, content)
    values ('00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', 'NOTE', '   ')$$,
  '23514', null, 'Conteúdo em branco é rejeitado'
);

select extensions.throws_ok(
  $$insert into public.notes (owner_id, work_id, session_id, kind, content)
    values ('00000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000030', '40000000-0000-4000-8000-000000000031', 'NOTE', 'Sessão incompatível')$$,
  '23503', null, 'Sessão de outra obra e usuário é rejeitada'
);

select extensions.throws_ok(
  $$insert into public.reviews (owner_id, work_id, rating)
    values ('00000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000031', 5)$$,
  '42501', null, 'A não cria review como B'
);

select extensions.throws_ok(
  $$insert into public.notes (owner_id, work_id, kind, content)
    values ('00000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000031', 'NOTE', 'Indevida')$$,
  '42501', null, 'A não cria anotação como B'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000031';

select extensions.is((select count(*)::bigint from public.reviews), 0::bigint, 'B não lê a review de A');
select extensions.is((select count(*)::bigint from public.notes), 0::bigint, 'B não lê notas de A');
select extensions.is(pg_temp.update_review('60000000-0000-4000-8000-000000000030', 2), 0::bigint, 'B não altera review de A');
select extensions.is(pg_temp.delete_review('60000000-0000-4000-8000-000000000030'), 0::bigint, 'B não exclui review de A');
select extensions.is(pg_temp.update_note('50000000-0000-4000-8000-000000000030', 'Alterada'), 0::bigint, 'B não altera nota de A');
select extensions.is(pg_temp.delete_note('50000000-0000-4000-8000-000000000030'), 0::bigint, 'B não exclui nota de A');

select extensions.lives_ok(
  $$insert into public.reviews (id, owner_id, work_id, rating)
    values ('60000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000031', 5)$$,
  'B cria sua própria review'
);

select extensions.lives_ok(
  $$insert into public.notes (id, owner_id, work_id, kind, content)
    values ('50000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000031', 'QUOTE', 'Citação de B')$$,
  'B cria sua própria citação'
);

select extensions.is((select count(*)::bigint from public.reviews), 1::bigint, 'B consulta somente sua review');
select extensions.is((select count(*)::bigint from public.notes), 1::bigint, 'B consulta somente sua nota');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000030';

select extensions.is(
  (select rating from public.reviews where id = '60000000-0000-4000-8000-000000000030'),
  4::numeric,
  'A review de A permaneceu inalterada'
);

select extensions.is(
  (select count(*)::bigint from public.notes),
  2::bigint,
  'As notas de A permaneceram intactas'
);

select * from extensions.finish();

rollback;
