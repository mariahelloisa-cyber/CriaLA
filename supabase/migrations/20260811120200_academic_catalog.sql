-- =============================================================================
-- Fase 02 — Catálogo acadêmico: course_categories, courses, units, classes
-- =============================================================================

-- -----------------------------------------------------------------------------
-- course_categories
-- Categorias fixas definidas no PDF (seção "2. Cadastro de Alunos > Categorias
-- de Curso"). Os valores iniciais são inseridos via supabase/seed.sql.
-- -----------------------------------------------------------------------------
create table public.course_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.course_categories is
  'Categorias de curso fixas do PDF: EJA, Curso Técnico, Curso Superior, Curso SouCria, Pós-graduação, Pós Técnico.';

-- -----------------------------------------------------------------------------
-- courses
-- -----------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  category_id uuid not null references public.course_categories (id),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- units
-- -----------------------------------------------------------------------------
create table public.units (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- classes (turmas)
-- Deve ser pré-cadastrada antes da matrícula de qualquer aluno (PDF seção 3).
-- -----------------------------------------------------------------------------
create table public.classes (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  course_id uuid not null references public.courses (id),
  unit_id uuid not null references public.units (id),
  start_date date not null,
  end_date date not null,
  status public.class_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_end_date_after_start_date check (end_date >= start_date)
);

comment on table public.classes is
  'Turmas. Todo aluno deve estar vinculado a uma turma pré-cadastrada (PDF seção 3 e 10).';
