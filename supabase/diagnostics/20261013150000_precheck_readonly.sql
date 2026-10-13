-- =============================================================================
-- PRÉ-CHECAGEM SOMENTE LEITURA para 20261013150000_security_hardening_final.sql
--
-- Executar no SQL Editor ANTES do script de hardening. Não altera nada:
-- roda numa transação READ ONLY e termina com ROLLBACK.
--
-- Resultado esperado: ZERO linhas. Cada linha retornada é uma divergência que
-- faria o script de hardening abortar — envie o resultado para análise.
-- Não retorna dados pessoais (só nomes de objetos do schema).
-- =============================================================================
begin;
set transaction read only;

with
expected_tables(t) as (
  values ('profiles'), ('course_categories'), ('courses'), ('units'), ('classes'), ('students'),
         ('enrollments'), ('sales'), ('sale_installments'), ('goals'), ('teachers'), ('class_teachers')
),
known_policies(p) as (
  values
    ('profiles.profiles_select'), ('profiles.profiles_update_manager'),
    ('course_categories.course_categories_select'), ('course_categories.course_categories_write_manager'),
    ('course_categories.course_categories_update_manager'), ('course_categories.course_categories_delete_manager'),
    ('courses.courses_select'), ('courses.courses_insert_manager'), ('courses.courses_update_manager'), ('courses.courses_delete_manager'),
    ('units.units_select'), ('units.units_insert_manager'), ('units.units_update_manager'), ('units.units_delete_manager'),
    ('classes.classes_select'), ('classes.classes_insert_manager'), ('classes.classes_update_manager'), ('classes.classes_delete_manager'),
    ('students.students_select'), ('students.students_insert'), ('students.students_update'), ('students.students_delete_manager'),
    ('enrollments.enrollments_select'), ('enrollments.enrollments_insert'), ('enrollments.enrollments_update_manager'), ('enrollments.enrollments_delete_manager'),
    ('sales.sales_select'), ('sales.sales_insert'), ('sales.sales_insert_manager'), ('sales.sales_update_manager'), ('sales.sales_delete_manager'),
    ('sale_installments.sale_installments_select'), ('sale_installments.sale_installments_insert_manager'),
    ('sale_installments.sale_installments_update_manager'), ('sale_installments.sale_installments_delete_manager'),
    ('goals.goals_select'), ('goals.goals_insert_manager'), ('goals.goals_update_manager'), ('goals.goals_delete_manager'),
    ('teachers.teachers_select_manager'), ('teachers.teachers_insert_manager'), ('teachers.teachers_update_manager'), ('teachers.teachers_delete_manager'),
    ('class_teachers.class_teachers_select_manager'), ('class_teachers.class_teachers_insert_manager'), ('class_teachers.class_teachers_delete_manager')
),
known_storage_policies(p) as (
  values ('teacher_contracts_select_manager'), ('teacher_contracts_insert_manager'), ('teacher_contracts_delete_manager')
),
known_rpcs(s) as (
  values
    ('create_student_with_enrollment(p_student jsonb, p_enrollment jsonb, p_seller_id uuid)'),
    ('create_student_with_enrollment(p_student jsonb, p_enrollment jsonb)'),
    ('create_sale_with_installments(p_enrollment_id uuid, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb, p_seller_id uuid)'),
    ('create_sale_with_installments(p_enrollment_id uuid, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb)'),
    ('create_enrollment_with_sale(p_student_id uuid, p_class_id uuid, p_enrollment_date date, p_expected_graduation_date date, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb, p_seller_id uuid)'),
    ('create_enrollment_with_sale(p_student_id uuid, p_class_id uuid, p_enrollment_date date, p_expected_graduation_date date, p_total_amount numeric, p_payment_method payment_method, p_payment_plan text, p_sale_date date, p_installments jsonb)')
),
problems(tipo, objeto) as (
  select 'tabela desconhecida em public', c.relname::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p')
     and c.relname not in (select t from expected_tables)
     and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  union all
  select 'tabela esperada ausente', t from expected_tables where to_regclass('public.' || t) is null
  union all
  select 'view em public', c.relname::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v', 'm')
     and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
  union all
  select 'policy desconhecida em public', format('%s.%s [%s %s]', tablename, policyname, permissive, cmd)
    from pg_policies
   where schemaname = 'public' and (tablename || '.' || policyname) not in (select p from known_policies)
  union all
  select 'policy desconhecida em storage.objects', format('%s [%s %s]', policyname, permissive, cmd)
    from pg_policies
   where schemaname = 'storage' and tablename = 'objects' and policyname not in (select p from known_storage_policies)
  union all
  select 'policy do Storage com definição inesperada', policyname::text
    from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname in (select p from known_storage_policies)
     and (permissive <> 'PERMISSIVE'
          or roles <> '{authenticated}'::name[]
          or coalesce(qual, with_check) not like '%teacher-contracts%'
          or coalesce(qual, with_check) not like '%is_manager()%')
  union all
  select 'assinatura de RPC desconhecida', format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid))
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('create_student_with_enrollment', 'create_sale_with_installments', 'create_enrollment_with_sale')
     and format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) not in (select s from known_rpcs)
  union all
  select 'RPC atual ausente ou SECURITY DEFINER', s
    from unnest(array[
      'public.create_student_with_enrollment(jsonb, jsonb, uuid)',
      'public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb, uuid)',
      'public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb, uuid)'
    ]) s
   where to_regprocedure(s) is null
      or (select p.prosecdef from pg_proc p where p.oid = to_regprocedure(s))
  union all
  select 'função SECURITY DEFINER desconhecida', p.oid::regprocedure::text
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef
     and p.proname not in ('is_manager', 'is_seller', 'get_my_seller_rank', 'handle_new_auth_user')
     and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  union all
  select 'trigger de cadastro ausente/desabilitado/divergente', 'auth.users.on_auth_user_created'
   where not exists (
     select 1 from pg_trigger t
      where t.tgrelid = 'auth.users'::regclass
        and t.tgname = 'on_auth_user_created'
        and t.tgenabled <> 'D'
        and t.tgfoid = to_regprocedure('public.handle_new_auth_user()')
   )
  union all
  -- get_my_seller_rank será recriada com CREATE OR REPLACE: a assinatura de
  -- retorno precisa ser idêntica, senão o script falha.
  select 'get_my_seller_rank com assinatura/retorno diferente', coalesce(to_regprocedure('public.get_my_seller_rank(date, date)')::text, 'ausente')
   where to_regprocedure('public.get_my_seller_rank(date, date)') is null
      or pg_get_function_result(to_regprocedure('public.get_my_seller_rank(date, date)'))
         <> 'TABLE(my_rank integer, total_sellers integer, realized_amount numeric, realized_students integer)'
  union all
  select 'is_manager/is_seller ausente ou não retorna boolean', s
    from unnest(array['public.is_manager()', 'public.is_seller()']) s
   where to_regprocedure(s) is null
      or pg_get_function_result(to_regprocedure(s)) <> 'boolean'
)
select * from problems order by 1, 2;

rollback;
