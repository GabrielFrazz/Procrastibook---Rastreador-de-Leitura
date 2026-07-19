-- A work leaves the reading queue as soon as it receives positive progress.

create function public.start_work_on_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if
    old.status = 'WANT_TO_READ'
    and new.status = 'WANT_TO_READ'
    and new.current_progress > 0
  then
    new.status := 'READING';
    new.started_at := coalesce(new.started_at, now());
  end if;

  return new;
end;
$$;

create trigger works_start_on_progress
before update of current_progress on public.works
for each row execute function public.start_work_on_progress();

revoke all on function public.start_work_on_progress()
from public, anon, authenticated;
