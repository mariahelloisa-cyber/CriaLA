-- =============================================================================
-- SouCriaLA — Hardening de segurança DEFINITIVO (VULN-01, VULN-02, VULN-03)
--
-- EXECUÇÃO: manual, no SQL Editor do Supabase, colando o arquivo INTEIRO de
-- uma vez. NÃO usar `supabase db push` (o remoto não tem
-- supabase_migrations.schema_migrations — o CLI tentaria reaplicar tudo).
--
-- SUBSTITUI 20261013120000_security_hardening.sql (nunca executado; removido
-- do repositório). NÃO executar também: remote-setup.sql (contém o trigger
-- vulnerável e recria o schema), seed-dados-teste.sql (dados fictícios).
--
-- COMO FUNCIONA (fail-safe):
--   1. PRÉ-CHECAGEM somente leitura. Se o banco divergir do que este script
--      conhece (policy, tabela, view, função SECURITY DEFINER ou assinatura de
--      RPC desconhecida; RPC de venda/matrícula SECURITY DEFINER; trigger de
--      cadastro ausente), o script ABORTA com a lista do que divergiu e a
--      transação inteira é revertida — nada muda. Policies desconhecidas NÃO
--      são apagadas às cegas: são reportadas.
--   2. Substitui, por nome explícito, TODAS as policies das 12 tabelas de
--      public por um conjunto revisado (o estado final não depende de como as
--      policies remotas foram escritas). Policies do Storage NÃO são alteradas
--      (já são manager-only via is_manager(), que é redefinida aqui).
--   3. PÓS-CHECAGEM: confere o estado final; se algo não bater, ABORTA.
--   Tudo dentro de BEGIN/COMMIT. Idempotente: pode ser executado de novo.
--
-- O QUE CORRIGE:
--   VULN-01: handle_new_auth_user() ignora qualquer metadata para role e
--            is_active; todo usuário novo nasce seller INATIVO. Default da
--            coluna profiles.is_active passa a false (defesa extra). Ativação
--            só pela Edge Function create-seller (service_role). Contas
--            existentes NÃO são alteradas.
--   VULN-02: todo acesso de vendedor exige is_seller() (ativo). is_manager()/
--            is_seller() são redefinidas para garantir a checagem de is_active
--            (o corpo remoto não foi inspecionado). O vendedor inativo só lê o
--            próprio profile (necessário para a mensagem "acesso desativado").
--   VULN-03: INSERT em sales só para gerente (remove sales_insert). UPDATE/
--            DELETE em sales, parcelas e metas continuam só para gerente.
--            Overloads antigos das RPCs removidos; anon perde EXECUTE.
--
-- NOVOS GERENTES (após este script): criar o usuário no painel do Supabase e
--   update public.profiles set role = 'manager', is_active = true where id = '<uuid>';
-- =============================================================================

begin;

set local lock_timeout = '5s';

-- =============================================================================
-- 1. PRÉ-CHECAGEM (somente leitura)
-- =============================================================================
do $pre$
declare
  v_tables text[] := array[
    'profiles', 'course_categories', 'courses', 'units', 'classes', 'students',
    'enrollments', 'sales', 'sale_installments', 'goals', 'teachers', 'class_teachers'
  ];
  -- Policies conhecidas: as das migrations do repositório (incluindo sales_insert
  -- antiga) + sales_insert_manager (caso a migration substituída tenha sido
  -- aplicada por engano, ou numa reexecução deste script).
  v_known_policies text[] := array[
    'profiles.profiles_select', 'profiles.profiles_update_manager',
    'course_categories.course_categories_select', 'course_categories.course_categories_write_manager',
    'course_categories.course_categories_update_manager', 'course_categories.course_categories_delete_manager',
    'courses.courses_select', 'courses.courses_insert_manager', 'courses.courses_update_manager', 'courses.courses_delete_manager',
    'units.units_select', 'units.units_insert_manager', 'units.units_update_manager', 'units.units_delete_manager',
    'classes.classes_select', 'classes.classes_insert_manager', 'classes.classes_update_manager', 'classes.classes_delete_manager',
    'students.students_select', 'students.students_insert', 'students.students_update', 'students.students_delete_manager',
    'enrollments.enrollments_select', 'enrollments.enrollments_insert', 'enrollments.enrollments_update_manager', 'enrollments.enrollments_delete_manager',
    'sales.sales_select', 'sales.sales_insert', 'sales.sales_insert_manager', 'sales.sales_update_manager', 'sales.sales_delete_manager',
    'sale_installments.sale_installments_select', 'sale_installments.sale_installments_insert_manager',
    'sale_installments.sale_installments_update_manager', 'sale_installments.sale_installments_delete_manager',
    'goals.goals_select', 'goals.goals_insert_manager', 'goals.goals_update_manager', 'goals.goals_delete_manager',
    'teachers.teachers_select_manager', 'teachers.teachers_insert_manager', 'teachers.teachers_update_manager', 'teachers.teachers_delete_manager',
    'class_teachers.class_teachers_select_manager', 'class_teachers.class_teachers_insert_manager', 'class_teachers.class_teachers_delete_manager'
  ];
  v_known_storage_policies text[] := array[
    'teacher_contracts_select_manager', 'teacher_contracts_insert_manager', 'teacher_contracts_delete_manager'
  ];
  -- Assinaturas aceitas das RPCs de escrita (atuais + antigas, que serão removidas).
  v_known_rpcs text[] := array[
    'create_student_with_enrollment(p_student jsonb, p_enrollment jsonb, p_seller_id uuid)',
    'create_student_with_enrollment(p_student jsonb, p_enrollment jsonb)',
    'create_sale_with_installments(p_enrollment_id uuid, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb, p_seller_id uuid)',
    'create_sale_with_installments(p_enrollment_id uuid, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb)',
    'create_enrollment_with_sale(p_student_id uuid, p_class_id uuid, p_enrollment_date date, p_expected_graduation_date date, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb, p_seller_id uuid)',
    'create_enrollment_with_sale(p_student_id uuid, p_class_id uuid, p_enrollment_date date, p_expected_graduation_date date, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb)'
  ];
  v_problems text[] := '{}';
  v_list text;
begin
  -- Tabelas de public fora das 12 conhecidas (poderiam não ter RLS revisada).
  select string_agg(c.relname, ', ') into v_list
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p')
     and c.relname <> all (v_tables)
     and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e');
  if v_list is not null then v_problems := v_problems || format('tabelas desconhecidas em public: %s', v_list); end if;

  -- Tabelas esperadas ausentes.
  select string_agg(t, ', ') into v_list
    from unnest(v_tables) t
   where to_regclass('public.' || t) is null;
  if v_list is not null then v_problems := v_problems || format('tabelas esperadas ausentes: %s', v_list); end if;

  -- Views/matviews em public (views ignoram a RLS do chamador por padrão).
  select string_agg(c.relname, ', ') into v_list
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v', 'm')
     and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e');
  if v_list is not null then v_problems := v_problems || format('views em public (revisar antes): %s', v_list); end if;

  -- Policies desconhecidas nas 12 tabelas.
  select string_agg(format('%s.%s [%s %s]', tablename, policyname, permissive, cmd), '; ') into v_list
    from pg_policies
   where schemaname = 'public'
     and (tablename || '.' || policyname) <> all (v_known_policies);
  if v_list is not null then v_problems := v_problems || format('policies desconhecidas em public: %s', v_list); end if;

  -- Policies desconhecidas em storage.objects (não serão alteradas, mas
  -- uma policy extra poderia expor os contratos).
  select string_agg(format('%s [%s %s]', policyname, permissive, cmd), '; ') into v_list
    from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname <> all (v_known_storage_policies);
  if v_list is not null then v_problems := v_problems || format('policies desconhecidas em storage.objects: %s', v_list); end if;

  -- As policies conhecidas do Storage não são recriadas aqui: exige que sejam
  -- restritas ao bucket e ao gerente (mesmo nome com conteúdo aberto = abortar).
  select string_agg(policyname, ', ') into v_list
    from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname = any (v_known_storage_policies)
     and (permissive <> 'PERMISSIVE'
          or roles <> '{authenticated}'::name[]
          or coalesce(qual, with_check) not like '%teacher-contracts%'
          or coalesce(qual, with_check) not like '%is_manager()%');
  if v_list is not null then v_problems := v_problems || format('policies do Storage com definição inesperada: %s', v_list); end if;

  -- Assinaturas desconhecidas das RPCs de escrita.
  select string_agg(format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid)), '; ') into v_list
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('create_student_with_enrollment', 'create_sale_with_installments', 'create_enrollment_with_sale')
     and format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) <> all (v_known_rpcs);
  if v_list is not null then v_problems := v_problems || format('assinaturas de RPC desconhecidas: %s', v_list); end if;

  -- As RPCs atuais precisam existir e ser SECURITY INVOKER (a RLS é a autoridade).
  select string_agg(s, '; ') into v_list
    from unnest(array[
      'public.create_student_with_enrollment(jsonb, jsonb, uuid)',
      'public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb, uuid)',
      'public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb, uuid)'
    ]) s
   where to_regprocedure(s) is null
      or (select p.prosecdef from pg_proc p where p.oid = to_regprocedure(s));
  if v_list is not null then v_problems := v_problems || format('RPC ausente ou SECURITY DEFINER: %s', v_list); end if;

  -- Funções SECURITY DEFINER desconhecidas em public (contornariam a RLS).
  select string_agg(p.oid::regprocedure::text, '; ') into v_list
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef
     and p.proname not in ('is_manager', 'is_seller', 'get_my_seller_rank', 'handle_new_auth_user')
     and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e');
  if v_list is not null then v_problems := v_problems || format('funções SECURITY DEFINER desconhecidas: %s', v_list); end if;

  -- Trigger de cadastro presente, habilitado e apontando para a função esperada.
  if not exists (
    select 1 from pg_trigger t
     where t.tgrelid = 'auth.users'::regclass
       and t.tgname = 'on_auth_user_created'
       and t.tgenabled <> 'D'
       and t.tgfoid = to_regprocedure('public.handle_new_auth_user()')
  ) then
    v_problems := v_problems || 'trigger on_auth_user_created ausente, desabilitado ou apontando para outra função'::text;
  end if;

  if cardinality(v_problems) > 0 then
    raise exception E'BLOQUEADO — o banco diverge do esperado; NADA foi alterado.\n- %',
      array_to_string(v_problems, E'\n- ');
  end if;
end
$pre$;

-- =============================================================================
-- 2. VULN-01 — criação de profile
-- =============================================================================
alter table public.profiles alter column is_active set default false;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Papel e status são FIXOS: nunca lidos de metadata (o user metadata é
  -- controlado pelo próprio usuário no signUp).
  insert into public.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, ''),
    new.email,
    'seller',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Cria o profile de todo novo auth.users como seller INATIVO. Nunca lê role/is_active de metadata. Ativação só via Edge Function create-seller (service_role); gerentes são promovidos manualmente via SQL.';

-- Trigger functions não precisam de EXECUTE para disparar; ninguém deve chamá-la.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- =============================================================================
-- 3. VULN-02 — helpers redefinidos (garante a checagem de is_active)
-- =============================================================================
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

comment on function public.is_manager() is
  'True se o usuário autenticado é um gerente ATIVO. SECURITY DEFINER para evitar recursão de RLS em profiles.';
comment on function public.is_seller() is
  'True se o usuário autenticado é um vendedor ATIVO. SECURITY DEFINER para evitar recursão de RLS em profiles.';

-- Mesmo corpo da migration 20260813130200 (recriado porque o corpo remoto não
-- foi inspecionado e a função é SECURITY DEFINER).
create or replace function public.get_my_seller_rank(p_from date, p_to date)
returns table (
  my_rank integer,
  total_sellers integer,
  realized_amount numeric,
  realized_students integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_seller() then
    raise exception 'Esta função é exclusiva para vendedores.';
  end if;

  return query
  with per_seller as (
    select
      p.id as seller_id,
      p.full_name,
      coalesce(sum(s.goal_amount), 0)::numeric(12, 2) as amount,
      coalesce(sum(s.goal_student_count), 0)::integer as students
    from public.profiles p
    left join public.sales s
      on s.seller_id = p.id
     and s.sale_date >= p_from
     and s.sale_date <= p_to
    where p.role = 'seller' and p.is_active
    group by p.id, p.full_name
  ),
  ranked as (
    select
      seller_id,
      amount,
      students,
      row_number() over (order by amount desc, full_name asc, seller_id asc)::integer as rnk
    from per_seller
  )
  select
    r.rnk,
    (select count(*)::integer from per_seller),
    r.amount,
    r.students
  from ranked r
  where r.seller_id = auth.uid();
end;
$$;

-- =============================================================================
-- 4. RLS habilitado (idempotente)
-- =============================================================================
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
alter table public.teachers enable row level security;
alter table public.class_teachers enable row level security;

-- =============================================================================
-- 5. Policies — substituição completa, por nome explícito
-- =============================================================================

-- profiles: cada usuário (ativo ou não) lê só o próprio perfil; gerente ativo
-- lê/edita todos. Sem INSERT/DELETE (profile nasce pelo trigger).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_manager()));

drop policy if exists profiles_update_manager on public.profiles;
create policy profiles_update_manager on public.profiles
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

-- Catálogo acadêmico: leitura por usuário ativo; escrita só gerente.
drop policy if exists course_categories_select on public.course_categories;
create policy course_categories_select on public.course_categories
  for select to authenticated
  using ((select public.is_seller()) or (select public.is_manager()));
drop policy if exists course_categories_write_manager on public.course_categories;
create policy course_categories_write_manager on public.course_categories
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists course_categories_update_manager on public.course_categories;
create policy course_categories_update_manager on public.course_categories
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists course_categories_delete_manager on public.course_categories;
create policy course_categories_delete_manager on public.course_categories
  for delete to authenticated
  using ((select public.is_manager()));

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to authenticated
  using ((select public.is_seller()) or (select public.is_manager()));
drop policy if exists courses_insert_manager on public.courses;
create policy courses_insert_manager on public.courses
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists courses_update_manager on public.courses;
create policy courses_update_manager on public.courses
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists courses_delete_manager on public.courses;
create policy courses_delete_manager on public.courses
  for delete to authenticated
  using ((select public.is_manager()));

drop policy if exists units_select on public.units;
create policy units_select on public.units
  for select to authenticated
  using ((select public.is_seller()) or (select public.is_manager()));
drop policy if exists units_insert_manager on public.units;
create policy units_insert_manager on public.units
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists units_update_manager on public.units;
create policy units_update_manager on public.units
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists units_delete_manager on public.units;
create policy units_delete_manager on public.units
  for delete to authenticated
  using ((select public.is_manager()));

drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
  for select to authenticated
  using ((select public.is_seller()) or (select public.is_manager()));
drop policy if exists classes_insert_manager on public.classes;
create policy classes_insert_manager on public.classes
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists classes_update_manager on public.classes;
create policy classes_update_manager on public.classes
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists classes_delete_manager on public.classes;
create policy classes_delete_manager on public.classes
  for delete to authenticated
  using ((select public.is_manager()));

-- students: vendedor ATIVO só nos próprios; gerente em todos; DELETE só gerente.
drop policy if exists students_select on public.students;
create policy students_select on public.students
  for select to authenticated
  using (
    (created_by = (select auth.uid()) and (select public.is_seller()))
    or (select public.is_manager())
  );
drop policy if exists students_insert on public.students;
create policy students_insert on public.students
  for insert to authenticated
  with check (
    (created_by = (select auth.uid()) and (select public.is_seller()))
    or (select public.is_manager())
  );
drop policy if exists students_update on public.students;
create policy students_update on public.students
  for update to authenticated
  using (
    (created_by = (select auth.uid()) and (select public.is_seller()))
    or (select public.is_manager())
  )
  with check (
    (created_by = (select auth.uid()) and (select public.is_seller()))
    or (select public.is_manager())
  );
drop policy if exists students_delete_manager on public.students;
create policy students_delete_manager on public.students
  for delete to authenticated
  using ((select public.is_manager()));

-- enrollments: vendedor ATIVO lê/cria matrículas dos próprios alunos;
-- UPDATE/DELETE só gerente.
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments
  for select to authenticated
  using (
    (select public.is_manager())
    or (
      (select public.is_seller())
      and exists (
        select 1 from public.students s
        where s.id = enrollments.student_id
          and s.created_by = (select auth.uid())
      )
    )
  );
drop policy if exists enrollments_insert on public.enrollments;
create policy enrollments_insert on public.enrollments
  for insert to authenticated
  with check (
    (select public.is_manager())
    or (
      (select public.is_seller())
      and created_by = (select auth.uid())
      and exists (
        select 1 from public.students s
        where s.id = enrollments.student_id
          and s.created_by = (select auth.uid())
      )
    )
  );
drop policy if exists enrollments_update_manager on public.enrollments;
create policy enrollments_update_manager on public.enrollments
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists enrollments_delete_manager on public.enrollments;
create policy enrollments_delete_manager on public.enrollments
  for delete to authenticated
  using ((select public.is_manager()));

-- sales: vendedor ATIVO só LÊ as próprias; INSERT/UPDATE/DELETE só gerente.
drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales
  for select to authenticated
  using (
    (seller_id = (select auth.uid()) and (select public.is_seller()))
    or (select public.is_manager())
  );
drop policy if exists sales_insert on public.sales;          -- VULN-03: ramo de vendedor removido
drop policy if exists sales_insert_manager on public.sales;
create policy sales_insert_manager on public.sales
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists sales_update_manager on public.sales;
create policy sales_update_manager on public.sales
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists sales_delete_manager on public.sales;
create policy sales_delete_manager on public.sales
  for delete to authenticated
  using ((select public.is_manager()));

-- sale_installments: vendedor ATIVO lê parcelas das próprias vendas; escrita só gerente.
drop policy if exists sale_installments_select on public.sale_installments;
create policy sale_installments_select on public.sale_installments
  for select to authenticated
  using (
    (select public.is_manager())
    or (
      (select public.is_seller())
      and exists (
        select 1 from public.sales s
        where s.id = sale_installments.sale_id
          and s.seller_id = (select auth.uid())
      )
    )
  );
drop policy if exists sale_installments_insert_manager on public.sale_installments;
create policy sale_installments_insert_manager on public.sale_installments
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists sale_installments_update_manager on public.sale_installments;
create policy sale_installments_update_manager on public.sale_installments
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists sale_installments_delete_manager on public.sale_installments;
create policy sale_installments_delete_manager on public.sale_installments
  for delete to authenticated
  using ((select public.is_manager()));

-- goals: vendedor ATIVO lê as próprias; escrita só gerente.
drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals
  for select to authenticated
  using (
    (seller_id = (select auth.uid()) and (select public.is_seller()))
    or (select public.is_manager())
  );
drop policy if exists goals_insert_manager on public.goals;
create policy goals_insert_manager on public.goals
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists goals_update_manager on public.goals;
create policy goals_update_manager on public.goals
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists goals_delete_manager on public.goals;
create policy goals_delete_manager on public.goals
  for delete to authenticated
  using ((select public.is_manager()));

-- teachers / class_teachers: só gerente (inalterado na regra; recriado para
-- garantir a definição).
drop policy if exists teachers_select_manager on public.teachers;
create policy teachers_select_manager on public.teachers
  for select to authenticated
  using ((select public.is_manager()));
drop policy if exists teachers_insert_manager on public.teachers;
create policy teachers_insert_manager on public.teachers
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists teachers_update_manager on public.teachers;
create policy teachers_update_manager on public.teachers
  for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));
drop policy if exists teachers_delete_manager on public.teachers;
create policy teachers_delete_manager on public.teachers
  for delete to authenticated
  using ((select public.is_manager()));

drop policy if exists class_teachers_select_manager on public.class_teachers;
create policy class_teachers_select_manager on public.class_teachers
  for select to authenticated
  using ((select public.is_manager()));
drop policy if exists class_teachers_insert_manager on public.class_teachers;
create policy class_teachers_insert_manager on public.class_teachers
  for insert to authenticated
  with check ((select public.is_manager()));
drop policy if exists class_teachers_delete_manager on public.class_teachers;
create policy class_teachers_delete_manager on public.class_teachers
  for delete to authenticated
  using ((select public.is_manager()));

-- =============================================================================
-- 6. RPCs — remove overloads antigos e restringe EXECUTE
-- =============================================================================
drop function if exists public.create_student_with_enrollment(jsonb, jsonb);
drop function if exists public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb);
drop function if exists public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb);

revoke all on function public.is_manager() from public, anon;
revoke all on function public.is_seller() from public, anon;
revoke all on function public.get_my_seller_rank(date, date) from public, anon;
revoke all on function public.create_student_with_enrollment(jsonb, jsonb, uuid) from public, anon;
revoke all on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb, uuid) from public, anon;
revoke all on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb, uuid) from public, anon;

grant execute on function public.is_manager() to authenticated;
grant execute on function public.is_seller() to authenticated;
grant execute on function public.get_my_seller_rank(date, date) to authenticated;
grant execute on function public.create_student_with_enrollment(jsonb, jsonb, uuid) to authenticated;
grant execute on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb, uuid) to authenticated;
grant execute on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb, uuid) to authenticated;

-- =============================================================================
-- 7. PÓS-CHECAGEM — aborta (rollback total) se o estado final não bater
-- =============================================================================
do $post$
declare
  v_final_policies text[] := array[
    'profiles.profiles_select', 'profiles.profiles_update_manager',
    'course_categories.course_categories_select', 'course_categories.course_categories_write_manager',
    'course_categories.course_categories_update_manager', 'course_categories.course_categories_delete_manager',
    'courses.courses_select', 'courses.courses_insert_manager', 'courses.courses_update_manager', 'courses.courses_delete_manager',
    'units.units_select', 'units.units_insert_manager', 'units.units_update_manager', 'units.units_delete_manager',
    'classes.classes_select', 'classes.classes_insert_manager', 'classes.classes_update_manager', 'classes.classes_delete_manager',
    'students.students_select', 'students.students_insert', 'students.students_update', 'students.students_delete_manager',
    'enrollments.enrollments_select', 'enrollments.enrollments_insert', 'enrollments.enrollments_update_manager', 'enrollments.enrollments_delete_manager',
    'sales.sales_select', 'sales.sales_insert_manager', 'sales.sales_update_manager', 'sales.sales_delete_manager',
    'sale_installments.sale_installments_select', 'sale_installments.sale_installments_insert_manager',
    'sale_installments.sale_installments_update_manager', 'sale_installments.sale_installments_delete_manager',
    'goals.goals_select', 'goals.goals_insert_manager', 'goals.goals_update_manager', 'goals.goals_delete_manager',
    'teachers.teachers_select_manager', 'teachers.teachers_insert_manager', 'teachers.teachers_update_manager', 'teachers.teachers_delete_manager',
    'class_teachers.class_teachers_select_manager', 'class_teachers.class_teachers_insert_manager', 'class_teachers.class_teachers_delete_manager'
  ];
  v_actual text[];
  v_problems text[] := '{}';
  v_list text;
begin
  select array_agg(tablename || '.' || policyname) into v_actual
    from pg_policies where schemaname = 'public';
  if not (v_actual @> v_final_policies and v_actual <@ v_final_policies) then
    v_problems := v_problems || 'conjunto de policies em public diferente do esperado'::text;
  end if;

  select string_agg(tablename || '.' || policyname, ', ') into v_list
    from pg_policies
   where schemaname = 'public'
     and (permissive <> 'PERMISSIVE'
          or coalesce(trim(qual), '') = 'true'
          or coalesce(trim(with_check), '') = 'true');
  if v_list is not null then v_problems := v_problems || format('policy aberta/inesperada: %s', v_list); end if;

  select string_agg(c.relname, ', ') into v_list
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;
  if v_list is not null then v_problems := v_problems || format('tabela sem RLS: %s', v_list); end if;

  if (select position('''role''' in prosrc) > 0 or position('raw_app_meta_data' in prosrc) > 0
        from pg_proc where oid = 'public.handle_new_auth_user()'::regprocedure) then
    v_problems := v_problems || 'handle_new_auth_user ainda lê role de metadata'::text;
  end if;

  if (select column_default from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_active') is distinct from 'false' then
    v_problems := v_problems || 'default de profiles.is_active não é false'::text;
  end if;

  select string_agg(p.oid::regprocedure::text, ', ') into v_list
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('is_manager', 'is_seller', 'get_my_seller_rank', 'handle_new_auth_user',
                       'create_student_with_enrollment', 'create_sale_with_installments', 'create_enrollment_with_sale')
     and has_function_privilege('anon', p.oid, 'execute');
  if v_list is not null then v_problems := v_problems || format('anon ainda executa: %s', v_list); end if;

  if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('create_student_with_enrollment', 'create_sale_with_installments', 'create_enrollment_with_sale')) <> 3 then
    v_problems := v_problems || 'overloads antigos das RPCs ainda existem'::text;
  end if;

  if cardinality(v_problems) > 0 then
    raise exception E'PÓS-CHECAGEM FALHOU — transação revertida, NADA foi alterado.\n- %',
      array_to_string(v_problems, E'\n- ');
  end if;
end
$post$;

-- Atualiza o cache de schema do PostgREST (overloads removidos).
notify pgrst, 'reload schema';

commit;
