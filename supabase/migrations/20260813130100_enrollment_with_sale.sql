-- =============================================================================
-- Fase 19 — create_enrollment_with_sale
--
-- Decisão 5 confirmada pelo usuário: um único processo "Nova matrícula +
-- venda" (aluno já cadastrado -> curso -> turma -> datas -> valor -> forma de
-- pagamento -> parcelas -> SALVAR) deve criar matrícula + venda + parcelas
-- atomicamente, sem deixar matrícula sem venda ou venda sem matrícula.
--
-- ESCOPO: NÃO cria aluno novo (o campo "Aluno" da decisão 5 seleciona um
-- student_id já existente — cadastro de aluno continua sendo responsabilidade
-- exclusiva do módulo Alunos/create_student_with_enrollment). "Vendedor" não
-- é parâmetro do cliente: é sempre students.created_by do aluno selecionado,
-- mesma regra já usada por create_sale_with_installments (Fase 11) — o campo
-- aparece na tela só como informação derivada/somente-leitura, nunca editável.
--
-- MANAGER-ONLY NA PRÁTICA (confirmado explicitamente pelo usuário, não uma
-- suposição): `sale_installments_insert_manager` (Fase 02) não tem cláusula
-- de vendedor — só gerente pode inserir parcelas. Esta função é
-- SECURITY INVOKER (mesmo padrão de create_student_with_enrollment e
-- create_sale_with_installments): se um vendedor a chamasse diretamente
-- (contornando a UI, que não oferece esta ação a ele), o INSERT em
-- enrollments/sales até poderia passar, mas o INSERT em sale_installments
-- falha com 42501 e a transação inteira é revertida — nenhuma matrícula
-- órfã ou venda sem parcelas é criada mesmo nesse cenário. Nenhuma policy de
-- RLS foi alterada por esta migration.
--
-- NÃO substitui nem remove os fluxos existentes:
--   - "Nova matrícula" (create_enrollment direto, Fase 10) continua existindo
--     para o vendedor cadastrar a própria matrícula sem venda.
--   - "Nova venda" (create_sale_with_installments, Fase 11) continua
--     existindo para o gerente anexar uma venda a uma matrícula já criada
--     sem venda (ex.: criada por um vendedor). Removê-lo quebraria esse caso.
-- Esta função é um TERCEIRO caminho, adicional, só para o gerente criar os
-- dois de uma vez quando o aluno já existe mas ainda não tem matrícula nem
-- venda.
-- =============================================================================
create or replace function public.create_enrollment_with_sale(
  p_student_id uuid,
  p_class_id uuid,
  p_enrollment_date date,
  p_expected_graduation_date date,
  p_total_amount numeric,
  p_payment_method public.payment_method,
  p_payment_plan text,
  p_sale_date date,
  p_installments jsonb -- array de {"installment_number": 1, "amount": 333.34, "due_date": "2026-09-12"}
)
returns table (enrollment_id uuid, sale_id uuid)
language plpgsql
as $$
declare
  v_enrollment_id uuid;
  v_course_id uuid;
  v_seller_id uuid;
  v_sale_id uuid;
  v_goal_amount numeric(12, 2);
  v_first_installment_amount numeric(12, 2);
  v_installment jsonb;
begin
  select c.course_id into v_course_id from public.classes c where c.id = p_class_id;

  if v_course_id is null then
    raise exception 'Turma não encontrada.';
  end if;

  select s.created_by into v_seller_id from public.students s where s.id = p_student_id;

  if v_seller_id is null then
    raise exception 'Aluno não encontrado.';
  end if;

  insert into public.enrollments (
    student_id, class_id, enrollment_date, expected_graduation_date, created_by
  )
  values (
    p_student_id, p_class_id, coalesce(p_enrollment_date, current_date), p_expected_graduation_date, auth.uid()
  )
  returning id into v_enrollment_id;

  select (installment ->> 'amount')::numeric
    into v_first_installment_amount
    from jsonb_array_elements(p_installments) as installment
   where (installment ->> 'installment_number')::int = 1;

  v_goal_amount := case
    when p_payment_method = 'bank_slip' then coalesce(v_first_installment_amount, p_total_amount)
    else p_total_amount
  end;

  insert into public.sales (
    enrollment_id, student_id, seller_id, course_id,
    total_amount, payment_method, payment_plan, sale_date,
    goal_amount, goal_student_count
  )
  values (
    v_enrollment_id, p_student_id, v_seller_id, v_course_id,
    p_total_amount, p_payment_method, nullif(p_payment_plan, ''), coalesce(p_sale_date, current_date),
    v_goal_amount, 1
  )
  returning id into v_sale_id;

  for v_installment in select * from jsonb_array_elements(p_installments)
  loop
    insert into public.sale_installments (sale_id, installment_number, amount, due_date)
    values (
      v_sale_id,
      (v_installment ->> 'installment_number')::int,
      (v_installment ->> 'amount')::numeric,
      nullif(v_installment ->> 'due_date', '')::date
    );
  end loop;

  return query select v_enrollment_id, v_sale_id;
end;
$$;

comment on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb) is
  'Cria matrícula + venda + parcelas em uma única transação para um aluno já existente (Fase 19, decisão 5). SECURITY INVOKER — RLS de enrollments/sales/sale_installments continua sendo a autoridade real; na prática só gerente consegue concluir (sale_installments_insert_manager não tem cláusula de vendedor). Não substitui create_enrollment nem create_sale_with_installments.';

revoke all on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb) from public;
grant execute on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb) to authenticated;
