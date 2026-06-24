alter table public.knowledge_items
  add column if not exists capture_kind text;

update public.knowledge_items
set capture_kind = case
  when file_mime = 'application/pdf' then 'pdf'
  when file_mime like 'image/%' then 'image'
  when file_mime like 'audio/%' then 'audio'
  when url is not null and nullif(trim(url), '') is not null then 'url'
  else 'note'
end
where capture_kind is null;

alter table public.knowledge_items
  alter column capture_kind set default 'note',
  alter column capture_kind set not null;

alter table public.knowledge_items
  drop constraint if exists knowledge_items_capture_kind_check;

alter table public.knowledge_items
  add constraint knowledge_items_capture_kind_check
  check (capture_kind in ('url', 'note', 'pdf', 'image', 'audio'));

alter table public.knowledge_items
  drop constraint if exists knowledge_items_item_type_check;

alter table public.knowledge_items
  add constraint knowledge_items_item_type_check
  check (item_type in ('Videos', 'Articles', 'PDFs', 'Social Links', 'Voice Notes', 'Images'));

update public.knowledge_items
set item_type = 'Images'
where file_mime like 'image/%'
  and item_type <> 'Images';

update public.knowledge_items
set preview_metadata = jsonb_set(
  coalesce(preview_metadata, '{}'::jsonb),
  '{captureKind}',
  to_jsonb(capture_kind),
  true
)
where capture_kind is not null;

update public.vault_files
set preview_metadata = jsonb_set(
  coalesce(preview_metadata, '{}'::jsonb),
  '{captureKind}',
  to_jsonb(
    case
      when mime_type = 'application/pdf' then 'pdf'
      when mime_type like 'image/%' then 'image'
      when mime_type like 'audio/%' then 'audio'
      else 'note'
    end
  ),
  true
);

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]::text[]
where id = 'vault-files';
