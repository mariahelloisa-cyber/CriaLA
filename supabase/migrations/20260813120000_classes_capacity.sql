-- =============================================================================
-- capacity (vagas) em classes
--
-- Não existia no schema original (Fase 02) nem no PDF. Adicionada a pedido
-- do usuário para exibir "Ocupação: matriculados/vagas" com barra de
-- progresso na listagem de Turmas — sem essa coluna não havia como calcular
-- o denominador da ocupação ("matriculados", ao contrário, já é calculável
-- via count() em enrollments.class_id, sem mudança de schema).
--
-- Nullable: turmas já cadastradas antes desta fase não têm vagas definidas e
-- não devem ganhar um valor inventado — a UI trata capacity = null ocultando
-- a barra de ocupação só para essa turma, em vez de mostrar um número
-- fabricado (mesmo padrão de nullable já usado em
-- enrollments.expected_graduation_date).
-- =============================================================================

alter table public.classes
  add column capacity integer;

alter table public.classes
  add constraint classes_capacity_positive check (capacity is null or capacity > 0);

comment on column public.classes.capacity is
  'Vagas totais da turma (opcional, nullable). Usado para calcular ocupação (matriculados/capacity) na listagem de Turmas.';
