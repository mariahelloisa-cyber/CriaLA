-- =============================================================================
-- Fase 02 — Tabela profiles
-- Relação 1:1 com auth.users. Não armazena senha; a autenticação é responsabilidade
-- exclusiva do Supabase Auth. Esta tabela guarda apenas os dados de perfil/aplicação.
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  -- NOTA (decisão técnica): o PDF lista "role ENUM" sem marcar NOT NULL, mas o
  -- campo é a base de todas as políticas de RLS (seller vs. manager). Um perfil
  -- sem role é um perfil sem permissões definidas, então optamos por NOT NULL
  -- para evitar estados inconsistentes. Ver relatório final para detalhes.
  role public.user_role not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de aplicação vinculado 1:1 a auth.users. Não contém credenciais.';
comment on column public.profiles.role is
  'Perfil de acesso: seller (vendedor) ou manager (gerente), conforme PDF seção 1.';
