create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_sessions_user_updated_at_idx
  on public.chat_sessions (user_id, updated_at desc);

grant select, insert, update, delete on public.chat_sessions to authenticated;

alter table public.chat_sessions enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
on public.chat_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
on public.chat_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
on public.chat_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own"
on public.chat_sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);

alter table public.chat_messages
  add column if not exists session_id uuid references public.chat_sessions(id) on delete cascade,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

insert into public.chat_sessions (user_id, title, last_message_at, created_at, updated_at)
select
  grouped.user_id,
  'Imported chat',
  grouped.last_message_at,
  grouped.created_at,
  grouped.last_message_at
from (
  select
    user_id,
    min(created_at) as created_at,
    max(created_at) as last_message_at
  from public.chat_messages
  where session_id is null
  group by user_id
) as grouped
on conflict do nothing;

update public.chat_messages as message
set session_id = session.id
from public.chat_sessions as session
where
  message.user_id = session.user_id
  and message.session_id is null
  and session.title = 'Imported chat';

alter table public.chat_messages
  alter column session_id set not null;

create index if not exists chat_messages_session_created_at_idx
  on public.chat_messages (session_id, created_at asc);

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row execute function public.set_updated_at();
