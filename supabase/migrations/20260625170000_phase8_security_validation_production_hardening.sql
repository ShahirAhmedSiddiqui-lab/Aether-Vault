create or replace function private.enforce_chat_message_session_ownership()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  if not exists (
    select 1
    from public.chat_sessions
    where id = new.session_id
      and user_id = new.user_id
  ) then
    raise exception 'Chat session does not belong to the current user.';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_vault_file_item_ownership()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  if new.item_id is not null and not exists (
    select 1
    from public.knowledge_items
    where id = new.item_id
      and user_id = new.user_id
  ) then
    raise exception 'Knowledge item does not belong to the current user.';
  end if;

  return new;
end;
$$;

drop trigger if exists chat_messages_enforce_session_ownership on public.chat_messages;
create trigger chat_messages_enforce_session_ownership
before insert or update on public.chat_messages
for each row execute function private.enforce_chat_message_session_ownership();

drop trigger if exists vault_files_enforce_item_ownership on public.vault_files;
create trigger vault_files_enforce_item_ownership
before insert or update on public.vault_files
for each row execute function private.enforce_vault_file_item_ownership();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vault-files',
  'vault-files',
  false,
  26214400,
  array[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp3',
    'audio/webm',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
