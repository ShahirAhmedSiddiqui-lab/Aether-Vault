create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  summary text not null,
  item_type text not null check (item_type in ('Videos', 'Articles', 'PDFs', 'Social Links', 'Voice Notes')),
  tags text[] not null default '{}'::text[],
  source text not null,
  author text,
  url text,
  flashcards jsonb not null default '[]'::jsonb,
  image_url text,
  read_time text,
  is_synthesized boolean not null default true,
  bookmarked boolean not null default false,
  file_path text,
  file_mime text,
  file_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null,
  summary_block text,
  referenced_sources jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists knowledge_items_user_created_at_idx
  on public.knowledge_items (user_id, created_at desc);

create index if not exists chat_messages_user_created_at_idx
  on public.chat_messages (user_id, created_at asc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists knowledge_items_set_updated_at on public.knowledge_items;
create trigger knowledge_items_set_updated_at
before update on public.knowledge_items
for each row execute function public.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.knowledge_items to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;

alter table public.profiles enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "knowledge_items_select_own" on public.knowledge_items;
create policy "knowledge_items_select_own"
on public.knowledge_items
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "knowledge_items_insert_own" on public.knowledge_items;
create policy "knowledge_items_insert_own"
on public.knowledge_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "knowledge_items_update_own" on public.knowledge_items;
create policy "knowledge_items_update_own"
on public.knowledge_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "knowledge_items_delete_own" on public.knowledge_items;
create policy "knowledge_items_delete_own"
on public.knowledge_items
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
on public.chat_messages
for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vault-files',
  'vault-files',
  false,
  52428800,
  array[
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'audio/webm',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vault_files_select_own" on storage.objects;
create policy "vault_files_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vault-files'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "vault_files_insert_own" on storage.objects;
create policy "vault_files_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vault-files'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

drop policy if exists "vault_files_update_own" on storage.objects;
create policy "vault_files_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'vault-files'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'vault-files'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

drop policy if exists "vault_files_delete_own" on storage.objects;
create policy "vault_files_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vault-files'
  and owner_id = (select auth.uid()::text)
);
