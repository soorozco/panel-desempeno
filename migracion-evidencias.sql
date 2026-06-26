-- =========================================================
--  Migración: ARCHIVOS DE EVIDENCIA en las actividades
--  Córrela UNA vez en: Supabase → SQL Editor → New query → Run
-- =========================================================

-- 1) Columna para guardar la lista de archivos de cada actividad
--    (metadatos: [{id,name,type,size,path,uploadedAt}])
alter table public.activities
  add column if not exists attachments jsonb default '[]'::jsonb;

-- 2) Bucket de almacenamiento PRIVADO para los archivos
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

-- 3) Permisos: solo usuarios con sesión iniciada pueden ver/subir/borrar
--    archivos de este bucket (mismo modelo "yo + supervisores").
drop policy if exists "evidencias_select" on storage.objects;
create policy "evidencias_select" on storage.objects
  for select to authenticated using (bucket_id = 'evidencias');

drop policy if exists "evidencias_insert" on storage.objects;
create policy "evidencias_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'evidencias');

drop policy if exists "evidencias_update" on storage.objects;
create policy "evidencias_update" on storage.objects
  for update to authenticated using (bucket_id = 'evidencias');

drop policy if exists "evidencias_delete" on storage.objects;
create policy "evidencias_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'evidencias');

-- Listo. Los archivos quedan protegidos: solo se ven con sesión iniciada
-- (la app genera enlaces temporales firmados para abrirlos).
