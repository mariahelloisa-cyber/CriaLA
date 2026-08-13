-- =============================================================================
-- Fase 02 — sales, sale_installments e goals
-- =============================================================================

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
