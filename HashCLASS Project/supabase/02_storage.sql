-- Public image/file bucket used by the app (profile photos, news images, chat files).
-- Run once in: Supabase Dashboard -> SQL Editor.
-- (No HTML/SVG/scripts are allowed, so the bucket cannot be used to host web pages.)
-- Files are readable by anyone who has the exact link (needed for <img> tags),
-- the bucket cannot be listed, and uploads are limited to 10 MB and safe file types.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 10485760, array[
  'image/jpeg','image/png','image/webp','image/gif',
  'application/pdf','text/plain',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip','application/x-zip-compressed','application/vnd.rar','application/x-rar-compressed',
  'audio/mpeg','audio/mp4','audio/webm','audio/ogg','audio/wav',
  'video/mp4','video/webm'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "uploads: anyone can add files" on storage.objects;
create policy "uploads: anyone can add files"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'uploads');
-- No select/update/delete policy on purpose: nobody can list, overwrite or delete files
-- through the public API. (Public links still work because the bucket is public.)
