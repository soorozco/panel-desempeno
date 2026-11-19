-- =========================================================
--  Migración: SEGUIMIENTO DE OFICIOS
--  Córrela UNA vez en: Supabase → SQL Editor → New query → Run
-- =========================================================

create table if not exists public.oficios (
  id            text primary key,
  numero        text not null unique,        -- ej. 'CGC/549/2026'
  fecha         text,                        -- 'YYYY-MM-DD'
  estatus       text default 'en_firma',     -- en_firma | firmado | enviado | acuse | cancelado
  asunto        text default '',
  destinatario  text default '',
  worker_id     text references public.workers(id) on delete set null, -- responsable
  notas         text default '',
  updated_at    text
);

create index if not exists oficios_estatus_idx on public.oficios(estatus);

-- Mismo modelo de seguridad que el resto: solo usuarios con sesión iniciada.
alter table public.oficios enable row level security;

drop policy if exists "oficios_auth_all" on public.oficios;
create policy "oficios_auth_all" on public.oficios
  for all
  to authenticated
  using (true)
  with check (true);
