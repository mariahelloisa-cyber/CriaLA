-- =============================================================================
-- Fase 02 — students e enrollments
-- Dados acadêmicos (curso/turma/categoria) NÃO são duplicados em students: a
-- relação é feita exclusivamente via enrollments, conforme instruído.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
create table public.students (
  id uuid primary key default extensions.gen_random_uuid(),

  -- Dados pessoais (PDF seção 2)
  full_name text not null,
  birth_date date,
  father_name text,
  mother_name text,
  rg text,
  cpf text,
  phone text,
  email text,

  -- Endereço (PDF seção 2)
  cep text,
  address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,

  -- Controle
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.students is
  'Cadastro de alunos. Dados acadêmicos (curso/turma/categoria) vivem em enrollments, não aqui.';
comment on column public.students.created_by is
  'Vendedor (profiles.id) que cadastrou o aluno. Usado pelas policies de RLS para restringir acesso por vendedor.';

-- -----------------------------------------------------------------------------
-- enrollments (matrículas)
-- Representa o vínculo obrigatório aluno <-> turma (PDF seções 3 e 10).
-- A categoria do curso do aluno é derivada via enrollments -> classes -> courses
-- -> course_categories (não é armazenada de forma redundante em students).
-- -----------------------------------------------------------------------------
create table public.enrollments (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students (id),
  class_id uuid not null references public.classes (id),
  enrollment_date date not null default current_date,
  status public.enrollment_status not null default 'active',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.enrollments is
  'Matrícula do aluno em uma turma. Toda matrícula deve gerar uma venda (ver sales).';
