-- =========================================================
--  Migración: agregar SUBACTIVIDADES a la tabla activities
--  Córrela UNA vez en: Supabase → SQL Editor → New query → Run
--  (Solo necesaria si ya habías creado las tablas antes de esta función.)
-- =========================================================

alter table public.activities
  add column if not exists subtasks jsonb default '[]'::jsonb;
