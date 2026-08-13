-- =============================================================================
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
-- =============================================================================

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
