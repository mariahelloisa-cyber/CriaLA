-- =============================================================================
-- Fase 02 — Fundação do banco de dados
-- Extensões e tipos ENUM utilizados pelo schema do SouCriaLA.
-- =============================================================================

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
