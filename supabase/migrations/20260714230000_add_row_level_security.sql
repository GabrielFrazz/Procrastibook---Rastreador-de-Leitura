begin;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.works enable row level security;
alter table public.works force row level security;
alter table public.contributors enable row level security;
alter table public.contributors force row level security;
alter table public.work_contributors enable row level security;
alter table public.work_contributors force row level security;
alter table public.work_genres enable row level security;
alter table public.work_genres force row level security;
alter table public.work_external_sources enable row level security;
alter table public.work_external_sources force row level security;
alter table public.reading_lists enable row level security;
alter table public.reading_lists force row level security;
alter table public.reading_list_items enable row level security;
alter table public.reading_list_items force row level security;
alter table public.reading_sessions enable row level security;
alter table public.reading_sessions force row level security;
alter table public.progress_events enable row level security;
alter table public.progress_events force row level security;
alter table public.reviews enable row level security;
alter table public.reviews force row level security;
alter table public.notes enable row level security;
alter table public.notes force row level security;
alter table public.goals enable row level security;
alter table public.goals force row level security;
alter table public.external_metadata_cache enable row level security;
alter table public.external_metadata_cache force row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

grant select, update on table public.profiles to authenticated;

grant select, insert, update, delete on table
  public.works,
  public.contributors,
  public.work_contributors,
  public.work_genres,
  public.work_external_sources,
  public.reading_lists,
  public.reading_list_items,
  public.reading_sessions,
  public.reviews,
  public.notes,
  public.goals
to authenticated;

grant select on table public.progress_events to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy works_owner_all
on public.works
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy contributors_owner_all
on public.contributors
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy work_contributors_owner_all
on public.work_contributors
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy work_genres_owner_all
on public.work_genres
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy work_external_sources_owner_all
on public.work_external_sources
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy reading_lists_owner_all
on public.reading_lists
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy reading_list_items_owner_all
on public.reading_list_items
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy reading_sessions_owner_all
on public.reading_sessions
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy progress_events_select_own
on public.progress_events
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy reviews_owner_all
on public.reviews
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy notes_owner_all
on public.notes
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy goals_owner_all
on public.goals
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

commit;
