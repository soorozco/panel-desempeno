-- =========================================================
--  Panel de Desempeño — Esquema de base de datos (Supabase)
--  Cópialo y pégalo en: Supabase → tu proyecto → SQL Editor → New query → Run
-- =========================================================

-- ---------- Tabla de trabajadores ----------
create table if not exists public.workers (
  id          text primary key,
  name        text not null,
  role        text default '',
  color       text default '#2f81f7',
  created_at  timestamptz default now()
);

-- ---------- Tabla de actividades ----------
create table if not exists public.activities (
  id          text primary key,
  worker_id   text references public.workers(id) on delete cascade,
  title       text not null,
  objective   text default '',
  priority    text default 'media',   -- alta | media | baja
  status      text default 'pendiente', -- pendiente | en_progreso | cumplida
  progress    int  default 0,         -- 0..100
  due         text,                   -- fecha límite 'YYYY-MM-DD' (puede ser nula)
  created_at  text,                   -- fecha de creación 'YYYY-MM-DD'
  subtasks    jsonb default '[]'::jsonb -- subactividades: [{id,title,weight,done}]
);

-- Si la tabla ya existía sin la columna subtasks, esto la agrega:
alter table public.activities add column if not exists subtasks jsonb default '[]'::jsonb;

create index if not exists activities_worker_idx on public.activities(worker_id);

-- =========================================================
--  Seguridad (RLS) — Control de accesos
--  Modelo elegido: "Yo + supervisores".
--  -> Cualquier usuario que haya INICIADO SESIÓN puede ver y editar
--     todos los datos. Quien NO ha iniciado sesión, no ve nada.
--  Los usuarios se crean manualmente en Supabase (Authentication → Users),
--  así nadie se registra solo: solo entran los que tú das de alta.
-- =========================================================

alter table public.workers    enable row level security;
alter table public.activities enable row level security;

-- Trabajadores: acceso total para usuarios autenticados
drop policy if exists "workers_auth_all" on public.workers;
create policy "workers_auth_all" on public.workers
  for all
  to authenticated
  using (true)
  with check (true);

-- Actividades: acceso total para usuarios autenticados
drop policy if exists "activities_auth_all" on public.activities;
create policy "activities_auth_all" on public.activities
  for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
--  Listo. Después de correr esto:
--  1) Authentication → Providers → Email: deja activado "Email".
--     (Opcional pero recomendado: desactiva "Confirm email" para que
--      los usuarios que crees entren de inmediato sin confirmar correo.)
--  2) Authentication → Users → "Add user": crea tu usuario y el de cada
--     supervisor (correo + contraseña).
--  3) Copia tu Project URL y la anon key en config.js
-- =========================================================
