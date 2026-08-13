-- =============================================================================
-- SouCriaLA — Verificação do banco remoto (Supabase SQL Editor)
--
-- Este arquivo é SOMENTE LEITURA: nenhum INSERT, UPDATE, DELETE, DROP ou
-- alteração de qualquer tipo. Todas as consultas usam os catálogos internos
-- do Postgres (information_schema / pg_catalog), que o SQL Editor consegue
-- ler integralmente independente de RLS (RLS restringe dados de tabela, não
-- metadados de schema).
--
-- Rode depois de executar supabase/remote-setup.sql. Cada bloco abaixo é uma
-- consulta independente — no SQL Editor, rode-as uma de cada vez (ou todas
-- juntas; a última exibida será o resultado principal, mas o editor também
-- permite rodar por blocos selecionando o trecho desejado).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Tabelas (10 esperadas)
-- Esperado: status = 'EXISTE' em todas as linhas.
-- -----------------------------------------------------------------------------
select
  expected.table_name,
  case when t.table_name is not null then 'EXISTE' else 'NÃO EXISTE' end as status
from (values
  ('profiles'),
  ('course_categories'),
  ('courses'),
  ('units'),
  ('classes'),
  ('students'),
  ('enrollments'),
  ('sales'),
  ('sale_installments'),
  ('goals')
) as expected(table_name)
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = expected.table_name
order by expected.table_name;


-- -----------------------------------------------------------------------------
-- 2. Enums (5 esperados) — existência
-- Esperado: status = 'EXISTE' em todas as linhas.
-- -----------------------------------------------------------------------------
select
  expected.enum_name,
  case when t.typname is not null then 'EXISTE' else 'NÃO EXISTE' end as status
from (values
  ('user_role'),
  ('class_status'),
  ('enrollment_status'),
  ('payment_method'),
  ('installment_status')
) as expected(enum_name)
left join pg_type t
  on t.typname = expected.enum_name and t.typnamespace = 'public'::regnamespace
order by expected.enum_name;


-- -----------------------------------------------------------------------------
-- 2b. Enums — valores (confirma especificamente 'seller'/'manager' em user_role)
-- Esperado para user_role: seller, manager (nessa ordem de criação).
-- -----------------------------------------------------------------------------
select
  t.typname as enum_name,
  e.enumlabel as value,
  e.enumsortorder as sort_order
from pg_type t
join pg_enum e on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname in (
    'user_role', 'class_status', 'enrollment_status', 'payment_method', 'installment_status'
  )
order by t.typname, e.enumsortorder;


-- -----------------------------------------------------------------------------
-- 3. Functions (4 esperadas)
-- Esperado: status = 'EXISTE' em todas as linhas.
-- -----------------------------------------------------------------------------
select
  expected.function_name,
  case when p.proname is not null then 'EXISTE' else 'NÃO EXISTE' end as status
from (values
  ('set_updated_at'),
  ('handle_new_auth_user'),
  ('is_manager'),
  ('is_seller')
) as expected(function_name)
left join pg_proc p
  on p.proname = expected.function_name and p.pronamespace = 'public'::regnamespace
order by expected.function_name;


-- -----------------------------------------------------------------------------
-- 4a. Triggers em public.* (10 esperados: set_updated_at em cada tabela)
-- -----------------------------------------------------------------------------
select
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;


-- -----------------------------------------------------------------------------
-- 4b. Trigger em auth.users (1 esperado: on_auth_user_created)
-- -----------------------------------------------------------------------------
select
  event_object_schema as schema_name,
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';


-- -----------------------------------------------------------------------------
-- 5. RLS habilitado (10 tabelas esperadas com rls_enabled = true)
-- -----------------------------------------------------------------------------
select
  expected.table_name,
  coalesce(c.relrowsecurity, false) as rls_enabled
from (values
  ('profiles'),
  ('course_categories'),
  ('courses'),
  ('units'),
  ('classes'),
  ('students'),
  ('enrollments'),
  ('sales'),
  ('sale_installments'),
  ('goals')
) as expected(table_name)
left join pg_class c
  on c.relname = expected.table_name and c.relnamespace = 'public'::regnamespace
order by expected.table_name;


-- -----------------------------------------------------------------------------
-- 6. Quantidade de policies por tabela
-- Esperado: profiles=2, course_categories=4, courses=4, units=4, classes=4,
-- students=4, enrollments=4, sales=4, sale_installments=4, goals=4 (total 38).
-- -----------------------------------------------------------------------------
select
  tablename as table_name,
  count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;


-- -----------------------------------------------------------------------------
-- 7. Categorias de curso (seed) — mostra o que já existe, se o seed já rodou
-- Antes de rodar remote-seed.sql: 0 linhas (esperado, não é erro).
-- Depois de rodar remote-seed.sql: 6 linhas (EJA, Curso Técnico, Curso
-- Superior, Curso SouCria, Pós-graduação, Pós Técnico).
-- -----------------------------------------------------------------------------
select name, slug, created_at
from public.course_categories
order by name;
