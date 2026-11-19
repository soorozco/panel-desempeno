-- =========================================================
--  Migración: SEGUIMIENTO DE OFICIOS RECIBIDOS
--  Córrela UNA vez en: Supabase → SQL Editor → New query → Run
-- =========================================================

create table if not exists public.oficios_recibidos (
  id            text primary key,
  control       text default '',             -- N. control de la oficialía
  numero        text not null,               -- número del oficio recibido
  fecha         text,                        -- fecha de recepción 'YYYY-MM-DD'
  servicio      text default '',             -- área de origen
  remitente     text default '',
  dirigido      text default '',
  tipo          text default 'original',     -- original | copia
  asunto        text default '',
  estatus       text default 'por_revisar',  -- por_revisar | pendiente | en_atencion | atendido | conocimiento
  respuesta     text default '',             -- oficio enviado con el que se contestó
  worker_id     text references public.workers(id) on delete set null, -- responsable
  notas         text default '',
  updated_at    text
);
create index if not exists oficios_recibidos_estatus_idx on public.oficios_recibidos(estatus);

-- Mismo modelo de seguridad que el resto: solo usuarios con sesión iniciada.
alter table public.oficios_recibidos enable row level security;
drop policy if exists "oficios_recibidos_auth_all" on public.oficios_recibidos;
create policy "oficios_recibidos_auth_all" on public.oficios_recibidos
  for all
  to authenticated
  using (true)
  with check (true);
