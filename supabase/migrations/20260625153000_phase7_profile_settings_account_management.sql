alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

update public.profiles
set preferences = jsonb_build_object(
  'brainResponseStyle', 'balanced',
  'defaultVoiceSpeed', 1,
  'reduceMotion', false,
  'compactMode', false
)
where preferences = '{}'::jsonb
   or preferences is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-assets',
  'profile-assets',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_assets_select_own" on storage.objects;
create policy "profile_assets_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-assets'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "profile_assets_insert_own" on storage.objects;
create policy "profile_assets_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-assets'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

drop policy if exists "profile_assets_update_own" on storage.objects;
create policy "profile_assets_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-assets'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'profile-assets'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

drop policy if exists "profile_assets_delete_own" on storage.objects;
create policy "profile_assets_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-assets'
  and owner_id = (select auth.uid()::text)
);
