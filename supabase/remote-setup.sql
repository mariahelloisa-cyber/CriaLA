-- =============================================================================
-- SouCriaLA — Setup consolidado para o Supabase SQL Editor
--
-- Este arquivo é uma CONSOLIDAÇÃO literal, na mesma ordem, do conteúdo das 9
-- migrations existentes em supabase/migrations/. Nenhuma tabela, coluna,
-- constraint, função, trigger, policy ou regra foi adicionada, removida ou
-- alterada em relação aos arquivos originais — apenas concatenadas para
-- execução em uma única sessão do SQL Editor, já que o banco remoto está
-- vazio e não foi possível usar `supabase db push` nesta fase.
--
-- Fonte de verdade: os 9 arquivos abaixo, nesta ordem exata.
--   1. 20260811120000_extensions_and_enums.sql
--   2. 20260811120100_profiles.sql
--   3. 20260811120200_academic_catalog.sql
--   4. 20260811120300_students_enrollments.sql
--   5. 20260811120400_sales_goals.sql
--   6. 20260811120500_updated_at_triggers.sql
--   7. 20260811120600_indexes.sql
--   8. 20260811120700_auth_profile_trigger.sql
--   9. 20260811120800_rls_and_policies.sql
--
-- NÃO contém: DROP, TRUNCATE, usuários de auth.users, seeds, service_role,
-- ou qualquer credencial. O seed (categorias de curso) está em
-- supabase/remote-seed.sql, para ser executado separadamente, depois deste
-- script e da verificação.
--
-- Como usar: cole o conteúdo completo no Supabase SQL Editor e execute uma
-- única vez, em um banco onde essas tabelas/tipos/funções ainda não existem.
-- =============================================================================


-- #############################################################################
-- # 1/9 — 20260811120000_extensions_and_enums.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — Fundação do banco de dados
-- Extensões e tipos ENUM utilizados pelo schema do SouCriaLA.
-- -----------------------------------------------------------------------------

-- gen_random_uuid() para geração de UUIDs como chave primária.
create extension if not exists pgcrypto with schema extensions;

-- Perfis de usuário (Vendedor / Gerente), conforme seção "1. Cadastro de Usuários" do PDF.
create type public.user_role as enum (
  'seller',
  'manager'
);

-- Status da turma, conforme seção "3. Cadastro de Turmas" do PDF.
create type public.class_status as enum (
  'open',
  'in_progress',
  'closed'
);

-- Status da matrícula do aluno em uma turma.
create type public.enrollment_status as enum (
  'active',
  'completed',
  'cancelled'
);

-- Forma de pagamento da venda, conforme seção "4. Cadastro da Venda" do PDF.
create type public.payment_method as enum (
  'cash',
  'credit_card',
  'bank_slip'
);

-- Status de cada parcela do plano de pagamento da venda.
create type public.installment_status as enum (
  'pending',
  'paid',
  'overdue',
  'cancelled'
);


-- #############################################################################
-- # 2/9 — 20260811120100_profiles.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — Tabela profiles
-- Relação 1:1 com auth.users. Não armazena senha; a autenticação é responsabilidade
-- exclusiva do Supabase Auth. Esta tabela guarda apenas os dados de perfil/aplicação.
-- -----------------------------------------------------------------------------

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


-- #############################################################################
-- # 3/9 — 20260811120200_academic_catalog.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — Catálogo acadêmico: course_categories, courses, units, classes
-- -----------------------------------------------------------------------------

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


-- #############################################################################
-- # 4/9 — 20260811120300_students_enrollments.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — students e enrollments
-- Dados acadêmicos (curso/turma/categoria) NÃO são duplicados em students: a
-- relação é feita exclusivamente via enrollments, conforme instruído.
-- -----------------------------------------------------------------------------

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


-- #############################################################################
-- # 5/9 — 20260811120400_sales_goals.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — sales, sale_installments e goals
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- sales
--
-- goal_amount / goal_student_count representam EXPLICITAMENTE o valor e a
-- quantidade que devem ser considerados na apuração de metas (PDF seção 5):
--   - À Vista / Cartão: goal_amount = total_amount (100%), goal_student_count = 1
--   - Boleto: goal_amount = valor da primeira mensalidade, goal_student_count = 1
-- Esses valores NÃO são derivados automaticamente de total_amount nesta etapa
-- (nenhuma lógica de negócio é implementada aqui — ver relatório final).
-- -----------------------------------------------------------------------------
create table public.sales (
  id uuid primary key default extensions.gen_random_uuid(),

  -- PDF regra 10: "Toda matrícula gera automaticamente uma venda" -> 1 venda
  -- por matrícula, daí o UNIQUE em enrollment_id.
  enrollment_id uuid not null unique references public.enrollments (id),
  student_id uuid not null references public.students (id),
  seller_id uuid not null references public.profiles (id),
  course_id uuid not null references public.courses (id),

  total_amount numeric(12, 2) not null,
  payment_method public.payment_method not null,
  payment_plan text,
  sale_date date not null default current_date,

  goal_amount numeric(12, 2) not null,
  goal_student_count integer not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sales_total_amount_non_negative check (total_amount >= 0),
  constraint sales_goal_amount_non_negative check (goal_amount >= 0),
  constraint sales_goal_student_count_non_negative check (goal_student_count >= 0)
);

comment on table public.sales is
  'Venda gerada automaticamente a cada matrícula. seller_id é o vendedor que cadastrou o aluno (PDF seção 4).';
comment on column public.sales.goal_amount is
  'Valor explícito a contabilizar na meta (regra de apuração da PDF seção 5). Não recalcular a partir de total_amount.';

-- -----------------------------------------------------------------------------
-- sale_installments
-- Representa o plano de pagamento. O PDF não especifica regras de cobrança;
-- portanto nenhuma lógica financeira além da estrutura é implementada.
-- -----------------------------------------------------------------------------
create table public.sale_installments (
  id uuid primary key default extensions.gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  installment_number integer not null,
  amount numeric(12, 2) not null,
  due_date date,
  paid_at timestamptz,
  status public.installment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sale_installments_number_positive check (installment_number > 0),
  constraint sale_installments_amount_non_negative check (amount >= 0),
  constraint sale_installments_unique_number unique (sale_id, installment_number)
);

comment on table public.sale_installments is
  'Parcelas do plano de pagamento de uma venda. Estrutura preparada para evolução futura de cobrança.';

-- -----------------------------------------------------------------------------
-- goals
-- Metas mensais individuais por vendedor (PDF seção 5).
-- -----------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default extensions.gen_random_uuid(),
  seller_id uuid not null references public.profiles (id),
  reference_month integer not null,
  reference_year integer not null,
  financial_target numeric(12, 2) not null default 0,
  student_target integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint goals_reference_month_range check (reference_month between 1 and 12),
  constraint goals_reference_year_range check (reference_year >= 2000),
  constraint goals_financial_target_non_negative check (financial_target >= 0),
  constraint goals_student_target_non_negative check (student_target >= 0),
  constraint goals_unique_seller_period unique (seller_id, reference_month, reference_year)
);

comment on table public.goals is
  'Meta mensal individual do vendedor, controlada por valor vendido e/ou quantidade de alunos (PDF seção 5).';


-- #############################################################################
-- # 6/9 — 20260811120500_updated_at_triggers.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — Função genérica de updated_at + triggers em todas as tabelas
-- que possuem essa coluna.
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Atualiza automaticamente a coluna updated_at antes de qualquer UPDATE.';

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.course_categories
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.sale_installments
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();


-- #############################################################################
-- # 7/9 — 20260811120600_indexes.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — Índices
-- Cobrem foreign keys e os filtros previstos no PDF (seção 10: "consultas e
-- filtros por período, curso, turma, categoria, vendedor e unidade") e os
-- relatórios comerciais/acadêmicos (seção 8).
-- -----------------------------------------------------------------------------

-- courses
create index idx_courses_category_id on public.courses (category_id);

-- classes
create index idx_classes_course_id on public.classes (course_id);
create index idx_classes_unit_id on public.classes (unit_id);
create index idx_classes_status on public.classes (status);

-- students
-- Filtro por vendedor (RLS de seller + tela "meus alunos").
create index idx_students_created_by on public.students (created_by);

-- enrollments
create index idx_enrollments_student_id on public.enrollments (student_id);
create index idx_enrollments_class_id on public.enrollments (class_id);
create index idx_enrollments_created_by on public.enrollments (created_by);
create index idx_enrollments_status on public.enrollments (status);
create index idx_enrollments_enrollment_date on public.enrollments (enrollment_date);

-- sales
create index idx_sales_seller_id on public.sales (seller_id);
create index idx_sales_student_id on public.sales (student_id);
create index idx_sales_course_id on public.sales (course_id);
create index idx_sales_sale_date on public.sales (sale_date);
create index idx_sales_payment_method on public.sales (payment_method);

-- goals
-- (seller_id, reference_year, reference_month) cobre "minhas metas".
create index idx_goals_seller_id on public.goals (seller_id);
-- (reference_year, reference_month) cobre "metas da empresa" no período, sem
-- depender do vendedor.
create index idx_goals_reference_period on public.goals (reference_year, reference_month);


-- #############################################################################
-- # 8/9 — 20260811120700_auth_profile_trigger.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — Criação automática de profile a partir de auth.users
--
-- O fluxo de login/cadastro de usuário ainda NÃO foi definido/implementado
-- nesta etapa (será feito em fase futura). Esta migration apenas prepara a
-- estrutura: sempre que um usuário for criado no Supabase Auth, um registro
-- correspondente em public.profiles é criado automaticamente.
--
-- O role é lido de raw_user_meta_data->>'role' (metadata enviado no momento do
-- signUp). Se ausente ou inválido, assume 'seller' como padrão seguro (menor
-- privilégio). Esta é uma decisão técnica temporária — o fluxo definitivo de
-- convite/criação de gerentes deverá ser definido na fase de autenticação.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
begin
  begin
    v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  exception
    when others then
      v_role := null;
  end;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, ''),
    new.email,
    coalesce(v_role, 'seller')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Cria automaticamente o profile correspondente quando um usuário é criado em auth.users. Preparação para a fase de autenticação.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- #############################################################################
-- # 9/9 — 20260811120800_rls_and_policies.sql
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Fase 02 — Row Level Security e Policies
--
-- Estratégia anti-recursão: políticas em public.profiles NUNCA fazem subquery
-- direta em public.profiles (isso é a causa clássica de recursão de RLS no
-- Postgres). Em vez disso, usamos funções auxiliares SECURITY DEFINER
-- (is_manager / is_seller), cujo dono (o role que aplica as migrations) tem
-- bypass de RLS por ser owner da tabela — a consulta interna às profiles
-- roda sem reavaliar policies, quebrando o ciclo.
--
-- search_path é fixado como '' (vazio) em todas as funções SECURITY DEFINER,
-- e todos os objetos são referenciados com schema explícito, para evitar
-- sequestro de search_path (privilege escalation via schema shadowing).
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- Funções auxiliares
-- -----------------------------------------------------------------------------
create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
      and p.is_active
  );
$$;

comment on function public.is_manager() is
  'True se o usuário autenticado é um gerente ativo. SECURITY DEFINER para evitar recursão de RLS em profiles.';

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'seller'
      and p.is_active
  );
$$;

comment on function public.is_seller() is
  'True se o usuário autenticado é um vendedor ativo. SECURITY DEFINER para evitar recursão de RLS em profiles.';

revoke all on function public.is_manager() from public;
grant execute on function public.is_manager() to authenticated;

revoke all on function public.is_seller() from public;
grant execute on function public.is_seller() to authenticated;

-- -----------------------------------------------------------------------------
-- Habilitar RLS em todas as tabelas com dados protegidos
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.course_categories enable row level security;
alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.sales enable row level security;
alter table public.sale_installments enable row level security;
alter table public.goals enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
--   Seller: vê apenas o próprio perfil.
--   Manager: vê e edita todos os perfis.
--   INSERT: nenhuma policy (criação só via trigger handle_new_auth_user, que
--   roda como SECURITY DEFINER e ignora RLS). DELETE: sem policy (não
--   especificado no PDF).
-- -----------------------------------------------------------------------------
create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_manager());

create policy profiles_update_manager
  on public.profiles
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- -----------------------------------------------------------------------------
-- course_categories / courses / units / classes
--   Qualquer usuário autenticado pode consultar (necessário para o vendedor
--   preencher o cadastro de aluno/matrícula). Escrita restrita ao gerente.
-- -----------------------------------------------------------------------------
create policy course_categories_select
  on public.course_categories
  for select
  to authenticated
  using (true);

create policy course_categories_write_manager
  on public.course_categories
  for insert
  to authenticated
  with check (public.is_manager());

create policy course_categories_update_manager
  on public.course_categories
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy course_categories_delete_manager
  on public.course_categories
  for delete
  to authenticated
  using (public.is_manager());

create policy courses_select
  on public.courses
  for select
  to authenticated
  using (true);

create policy courses_insert_manager
  on public.courses
  for insert
  to authenticated
  with check (public.is_manager());

create policy courses_update_manager
  on public.courses
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy courses_delete_manager
  on public.courses
  for delete
  to authenticated
  using (public.is_manager());

create policy units_select
  on public.units
  for select
  to authenticated
  using (true);

create policy units_insert_manager
  on public.units
  for insert
  to authenticated
  with check (public.is_manager());

create policy units_update_manager
  on public.units
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy units_delete_manager
  on public.units
  for delete
  to authenticated
  using (public.is_manager());

create policy classes_select
  on public.classes
  for select
  to authenticated
  using (true);

create policy classes_insert_manager
  on public.classes
  for insert
  to authenticated
  with check (public.is_manager());

create policy classes_update_manager
  on public.classes
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy classes_delete_manager
  on public.classes
  for delete
  to authenticated
  using (public.is_manager());

-- -----------------------------------------------------------------------------
-- students
--   Seller: SELECT/INSERT/UPDATE restritos aos alunos que ele mesmo cadastrou
--   (created_by = auth.uid()). Manager: acesso total, incluindo DELETE.
-- -----------------------------------------------------------------------------
create policy students_select
  on public.students
  for select
  to authenticated
  using (created_by = auth.uid() or public.is_manager());

create policy students_insert
  on public.students
  for insert
  to authenticated
  with check (created_by = auth.uid() or public.is_manager());

create policy students_update
  on public.students
  for update
  to authenticated
  using (created_by = auth.uid() or public.is_manager())
  with check (created_by = auth.uid() or public.is_manager());

create policy students_delete_manager
  on public.students
  for delete
  to authenticated
  using (public.is_manager());

-- -----------------------------------------------------------------------------
-- enrollments
--   Seller: SELECT/INSERT restritos a matrículas dos seus próprios alunos.
--   O PDF não concede ao vendedor permissão de editar/cancelar matrícula, por
--   isso não há policy de UPDATE/DELETE para seller (apenas manager).
-- -----------------------------------------------------------------------------
create policy enrollments_select
  on public.enrollments
  for select
  to authenticated
  using (
    public.is_manager()
    or exists (
      select 1
      from public.students s
      where s.id = enrollments.student_id
        and s.created_by = auth.uid()
    )
  );

create policy enrollments_insert
  on public.enrollments
  for insert
  to authenticated
  with check (
    public.is_manager()
    or (
      created_by = auth.uid()
      and exists (
        select 1
        from public.students s
        where s.id = enrollments.student_id
          and s.created_by = auth.uid()
      )
    )
  );

create policy enrollments_update_manager
  on public.enrollments
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy enrollments_delete_manager
  on public.enrollments
  for delete
  to authenticated
  using (public.is_manager());

-- -----------------------------------------------------------------------------
-- sales
--   Seller: SELECT restrito às próprias vendas (seller_id = auth.uid()).
--   INSERT permitido para o vendedor apenas quando a venda é dele mesmo e
--   referencia um aluno/matrícula que ele também é dono. UPDATE/DELETE
--   (registros financeiros) restritos ao gerente.
-- -----------------------------------------------------------------------------
create policy sales_select
  on public.sales
  for select
  to authenticated
  using (seller_id = auth.uid() or public.is_manager());

create policy sales_insert
  on public.sales
  for insert
  to authenticated
  with check (
    public.is_manager()
    or (
      seller_id = auth.uid()
      and exists (
        select 1
        from public.students s
        where s.id = sales.student_id
          and s.created_by = auth.uid()
      )
      and exists (
        select 1
        from public.enrollments e
        where e.id = sales.enrollment_id
          and e.student_id = sales.student_id
      )
    )
  );

create policy sales_update_manager
  on public.sales
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy sales_delete_manager
  on public.sales
  for delete
  to authenticated
  using (public.is_manager());

-- -----------------------------------------------------------------------------
-- sale_installments
--   Não especificado explicitamente no PDF: visibilidade herdada da venda
--   associada (mesmo critério de sales). Escrita restrita ao gerente nesta
--   etapa, já que nenhuma lógica financeira foi definida.
-- -----------------------------------------------------------------------------
create policy sale_installments_select
  on public.sale_installments
  for select
  to authenticated
  using (
    public.is_manager()
    or exists (
      select 1
      from public.sales s
      where s.id = sale_installments.sale_id
        and s.seller_id = auth.uid()
    )
  );

create policy sale_installments_insert_manager
  on public.sale_installments
  for insert
  to authenticated
  with check (public.is_manager());

create policy sale_installments_update_manager
  on public.sale_installments
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy sale_installments_delete_manager
  on public.sale_installments
  for delete
  to authenticated
  using (public.is_manager());

-- -----------------------------------------------------------------------------
-- goals
--   Seller: SELECT restrito às próprias metas. Cadastro de metas é permissão
--   exclusiva do gerente (PDF seção 1 — "Cadastrar metas" só é listado para
--   Gerente).
-- -----------------------------------------------------------------------------
create policy goals_select
  on public.goals
  for select
  to authenticated
  using (seller_id = auth.uid() or public.is_manager());

create policy goals_insert_manager
  on public.goals
  for insert
  to authenticated
  with check (public.is_manager());

create policy goals_update_manager
  on public.goals
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy goals_delete_manager
  on public.goals
  for delete
  to authenticated
  using (public.is_manager());

-- =============================================================================
-- FIM do setup consolidado. Próximos passos:
--   1. Rode supabase/verify-remote.sql para conferir tabelas, enums, functions,
--      triggers, RLS e policies.
--   2. Rode supabase/remote-seed.sql para inserir as 6 categorias de curso.
-- =============================================================================
