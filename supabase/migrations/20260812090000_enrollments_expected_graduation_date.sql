-- =============================================================================
-- Fase 07 — expected_graduation_date em enrollments
--
-- Divergência identificada: o PDF (seção 2, "Dados Acadêmicos") lista "Data
-- Prevista de Formação" como dado capturado no cadastro do aluno, mas o
-- schema (Fase 02) deliberadamente mantém dados acadêmicos em enrollments,
-- não em students — um aluno pode ter mais de uma matrícula ao longo do
-- tempo, e a própria seção 2 do PDF antecipa isso: "será utilizada
-- futuramente para geração de campanhas automáticas de oferta de novos
-- cursos, criando uma esteira de formação contínua do aluno". Ou seja, o
-- dado é por matrícula/formação, não por aluno. Adicionar a coluna em
-- enrollments, ao lado de enrollment_date ("Data da Matrícula"), é
-- consistente com essa decisão arquitetural existente e com a semântica do
-- PDF (ambas as datas nascem no mesmo ato de matrícula).
--
-- Nullable: nem todo fluxo de matrícula necessariamente informa essa data no
-- momento do cadastro (mesmo padrão já usado em students.birth_date).
-- =============================================================================

alter table public.enrollments
  add column expected_graduation_date date;

comment on column public.enrollments.expected_graduation_date is
  'Data prevista de formação (PDF seção 2). Usada futuramente para campanhas de renovação/oferta de novos cursos (PDF seção 2, observação).';

alter table public.enrollments
  add constraint enrollments_graduation_after_enrollment
  check (expected_graduation_date is null or expected_graduation_date >= enrollment_date);


-- =============================================================================
-- create_student_with_enrollment
--
-- PDF regra 10: "Todo aluno deve obrigatoriamente estar vinculado a uma
-- turma." Se o frontend fizesse dois INSERTs separados (students, depois
-- enrollments), uma falha entre os dois passos deixaria um aluno "órfão"
-- sem matrícula — violando essa regra. Esta função agrupa os dois INSERTs
-- em uma única chamada, e o Postgres já trata uma função chamada como um
-- único statement transacional: se qualquer INSERT falhar (ex.: turma
-- inexistente, violação de constraint), TUDO é revertido automaticamente,
-- sem precisar de BEGIN/COMMIT/EXCEPTION manual.
--
-- SECURITY INVOKER (padrão — nenhuma cláusula SECURITY DEFINER abaixo):
-- a função roda com o role de quem a chama, então as policies de RLS de
-- students_insert e enrollments_insert continuam valendo normalmente. Não há
-- bypass de segurança aqui — o único ganho é atomicidade. created_by nunca é
-- aceito como parâmetro do cliente: é sempre auth.uid() do chamador.
--
-- NÃO cria uma linha em sales. A regra do PDF "toda matrícula gera
-- automaticamente uma venda" depende de dados do módulo comercial (valor,
-- forma de pagamento, vendedor responsável) que esta fase (Alunos) não
-- coleta — fica documentado como pendência explícita para o módulo de
-- Vendas/Matrículas, não implementado silenciosamente aqui.
-- =============================================================================
create or replace function public.create_student_with_enrollment(
  p_student jsonb,
  p_enrollment jsonb
)
returns table (student_id uuid, enrollment_id uuid)
language plpgsql
as $$
declare
  v_student_id uuid;
  v_enrollment_id uuid;
begin
  insert into public.students (
    full_name, birth_date, father_name, mother_name, rg, cpf, phone, email,
    cep, address, number, complement, neighborhood, city, state, created_by
  )
  values (
    p_student ->> 'full_name',
    nullif(p_student ->> 'birth_date', '')::date,
    nullif(p_student ->> 'father_name', ''),
    nullif(p_student ->> 'mother_name', ''),
    nullif(p_student ->> 'rg', ''),
    nullif(p_student ->> 'cpf', ''),
    nullif(p_student ->> 'phone', ''),
    nullif(p_student ->> 'email', ''),
    nullif(p_student ->> 'cep', ''),
    nullif(p_student ->> 'address', ''),
    nullif(p_student ->> 'number', ''),
    nullif(p_student ->> 'complement', ''),
    nullif(p_student ->> 'neighborhood', ''),
    nullif(p_student ->> 'city', ''),
    nullif(p_student ->> 'state', ''),
    auth.uid()
  )

  
  returning id into v_student_id;

  insert into public.enrollments (
    student_id, class_id, enrollment_date, expected_graduation_date, created_by
  )
  values (
    v_student_id,
    (p_enrollment ->> 'class_id')::uuid,
    coalesce(nullif(p_enrollment ->> 'enrollment_date', '')::date, current_date),
    nullif(p_enrollment ->> 'expected_graduation_date', '')::date,
    auth.uid()
  )
  returning id into v_enrollment_id;

  return query select v_student_id, v_enrollment_id;
end;
$$;

comment on function public.create_student_with_enrollment(jsonb, jsonb) is
  'Cria aluno + matrícula em uma única transação (PDF: aluno sempre vinculado a turma). SECURITY INVOKER — RLS de students/enrollments continua sendo a autoridade. Não cria sales (depende do módulo de Vendas).';

revoke all on function public.create_student_with_enrollment(jsonb, jsonb) from public;
grant execute on function public.create_student_with_enrollment(jsonb, jsonb) to authenticated;
