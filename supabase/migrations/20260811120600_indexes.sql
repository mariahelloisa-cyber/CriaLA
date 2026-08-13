-- =============================================================================
-- Fase 02 — Índices
-- Cobrem foreign keys e os filtros previstos no PDF (seção 10: "consultas e
-- filtros por período, curso, turma, categoria, vendedor e unidade") e os
-- relatórios comerciais/acadêmicos (seção 8).
-- =============================================================================

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
