begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(20);

create function pg_temp.update_goal(target_id uuid, new_target numeric)
returns bigint language plpgsql set search_path = '' as $$
declare affected_rows bigint;
begin
  update public.goals set target_value = new_target where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create function pg_temp.delete_goal(target_id uuid)
returns bigint language plpgsql set search_path = '' as $$
declare affected_rows bigint;
begin
  delete from public.goals where id = target_id;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-000000000040', 'goals-a@example.test', '{"display_name":"Metas A"}'::jsonb),
  ('00000000-0000-4000-8000-000000000041', 'goals-b@example.test', '{"display_name":"Metas B"}'::jsonb);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000040';
set local request.jwt.claim.role = 'authenticated';

select extensions.lives_ok(
  $$insert into public.goals (id, owner_id, metric, target_value, period_start, period_end)
    values ('30000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000040', 'WORKS_FINISHED', 12, '2026-01-01', '2026-12-31')$$,
  'A cria meta de obras finalizadas'
);

select extensions.lives_ok(
  $$insert into public.goals (id, owner_id, metric, target_value, period_start, period_end)
    values ('30000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000040', 'PAGES_READ', 1200, '2026-01-01', '2026-12-31')$$,
  'A cria meta de páginas'
);

select extensions.lives_ok(
  $$insert into public.goals (id, owner_id, metric, target_value, period_start, period_end)
    values ('30000000-0000-4000-8000-000000000043', '00000000-0000-4000-8000-000000000040', 'CHAPTERS_READ', 80, '2026-01-01', '2026-12-31')$$,
  'A cria meta de capítulos'
);

select extensions.lives_ok(
  $$insert into public.goals (id, owner_id, metric, target_value, period_start, period_end)
    values ('30000000-0000-4000-8000-000000000044', '00000000-0000-4000-8000-000000000040', 'MINUTES_READ', 3000, '2026-01-01', '2026-12-31')$$,
  'A cria meta de minutos'
);

select extensions.is(
  (select count(*)::bigint from public.goals),
  4::bigint,
  'A consulta suas quatro metas'
);

select extensions.throws_ok(
  $$insert into public.goals (owner_id, metric, target_value, period_start, period_end)
    values ('00000000-0000-4000-8000-000000000040', 'PAGES_READ', 0, '2026-01-01', '2026-12-31')$$,
  '23514', null, 'Alvo igual a zero é rejeitado'
);

select extensions.throws_ok(
  $$insert into public.goals (owner_id, metric, target_value, period_start, period_end)
    values ('00000000-0000-4000-8000-000000000040', 'PAGES_READ', 100, '2026-12-31', '2026-01-01')$$,
  '23514', null, 'Período invertido é rejeitado'
);

select extensions.is(
  pg_temp.update_goal('30000000-0000-4000-8000-000000000040', 15),
  1::bigint,
  'A atualiza a própria meta'
);

select extensions.is(
  (select target_value from public.goals where id = '30000000-0000-4000-8000-000000000040'),
  15::numeric,
  'A consulta o novo alvo'
);

select extensions.is(
  pg_temp.delete_goal('30000000-0000-4000-8000-000000000043'),
  1::bigint,
  'A exclui a própria meta'
);

select extensions.is(
  (select count(*)::bigint from public.goals),
  3::bigint,
  'A permanece com três metas'
);

select extensions.throws_ok(
  $$insert into public.goals (owner_id, metric, target_value, period_start, period_end)
    values ('00000000-0000-4000-8000-000000000041', 'PAGES_READ', 500, '2026-01-01', '2026-12-31')$$,
  '42501', null, 'A não cria uma meta como B'
);

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000041';

select extensions.is((select count(*)::bigint from public.goals), 0::bigint, 'B não lê metas de A');
select extensions.is(pg_temp.update_goal('30000000-0000-4000-8000-000000000040', 20), 0::bigint, 'B não altera meta de A');
select extensions.is(pg_temp.delete_goal('30000000-0000-4000-8000-000000000040'), 0::bigint, 'B não exclui meta de A');

select extensions.lives_ok(
  $$insert into public.goals (id, owner_id, metric, target_value, period_start, period_end)
    values ('30000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000041', 'MINUTES_READ', 600, '2026-07-01', '2026-07-31')$$,
  'B cria a própria meta'
);

select extensions.is((select count(*)::bigint from public.goals), 1::bigint, 'B consulta somente a própria meta');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000040';

select extensions.is((select count(*)::bigint from public.goals), 3::bigint, 'A continua vendo somente suas três metas');
select extensions.is(
  (select target_value from public.goals where id = '30000000-0000-4000-8000-000000000040'),
  15::numeric,
  'A meta de A permaneceu inalterada por B'
);
select extensions.is(
  (select count(*)::bigint from public.goals where id = '30000000-0000-4000-8000-000000000041'),
  0::bigint,
  'A não enxerga a meta de B'
);

select * from extensions.finish();

rollback;
