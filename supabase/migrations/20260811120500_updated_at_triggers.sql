-- =============================================================================
-- Fase 02 — Função genérica de updated_at + triggers em todas as tabelas
-- que possuem essa coluna.
-- =============================================================================

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
