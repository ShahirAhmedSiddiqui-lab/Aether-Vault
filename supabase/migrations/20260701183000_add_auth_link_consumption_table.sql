create table if not exists public.auth_link_consumption (
  link_hash text primary key,
  link_type text not null check (link_type in ('confirmation', 'recovery')),
  consumed_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.auth_link_consumption
  add column if not exists link_type text;

alter table public.auth_link_consumption
  add column if not exists consumed_at timestamptz not null default timezone('utc'::text, now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'auth_link_consumption_link_type_check'
      and conrelid = 'public.auth_link_consumption'::regclass
  ) then
    alter table public.auth_link_consumption
      add constraint auth_link_consumption_link_type_check
      check (link_type in ('confirmation', 'recovery'));
  end if;
end
$$;

alter table public.auth_link_consumption enable row level security;

grant select, insert on public.auth_link_consumption to anon;
grant select, insert on public.auth_link_consumption to authenticated;

drop policy if exists "auth_link_consumption_select" on public.auth_link_consumption;
create policy "auth_link_consumption_select"
on public.auth_link_consumption
for select
to anon, authenticated
using (true);

drop policy if exists "auth_link_consumption_insert" on public.auth_link_consumption;
drop policy if exists "auth_link_consumption_insert_policy" on public.auth_link_consumption;
create policy "auth_link_consumption_insert"
on public.auth_link_consumption
for insert
to anon, authenticated
with check (link_type in ('confirmation', 'recovery'));
