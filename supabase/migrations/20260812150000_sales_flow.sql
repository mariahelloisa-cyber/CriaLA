-- =============================================================================
-- Fase 11 — create_sale_with_installments
--
-- MOTIVO:
-- Uma venda e suas parcelas representam uma única operação comercial (PDF
-- seções 4 e 9 do Prompt 11: "não fique uma venda sem parcelas quando
-- parcelas forem obrigatórias"). Se o frontend fizesse dois conjuntos de
-- INSERT separados (sales, depois sale_installments), uma falha entre os
-- dois passos deixaria uma venda "órfã" sem parcelas.
--
-- Além disso, a policy real `sale_installments_insert_manager` (Fase 02,
-- 20260811120800_rls_and_policies.sql) permite INSERT em sale_installments
-- **apenas para gerente**, sem cláusula de vendedor — diferente de
-- `sales_insert`, que tecnicamente permite um vendedor criar a venda da
-- própria matrícula. Isso significa que, mesmo que um vendedor conseguisse
-- inserir a linha em `sales`, o INSERT das parcelas falharia por RLS,
-- deixando exatamente a venda órfã que este mecanismo existe para evitar.
-- Por isso a Fase 11 restringe a criação de venda à interface do gerente
-- (ver relatório final, seção H/I) — e esta função reforça isso com
-- atomicidade real de banco.
--
-- ALTERAÇÃO PROPOSTA:
-- Função `create_sale_with_installments`, nos mesmos moldes de
-- `create_student_with_enrollment` (20260812090000): agrupa os INSERTs de
-- `sales` + N linhas de `sale_installments` em uma única chamada. Postgres
-- trata a função como um único statement transacional — se qualquer INSERT
-- falhar (RLS, constraint, matrícula já vendida), TUDO é revertido.
--
-- SECURITY INVOKER (padrão — nenhuma cláusula SECURITY DEFINER abaixo): a
-- função roda com o role de quem chama, então `sales_insert` e
-- `sale_installments_insert_manager` continuam sendo a autoridade real. Não
-- há bypass de segurança aqui — o único ganho é atomicidade. Como
-- consequência deliberada, se um vendedor chamar esta função diretamente
-- (contornando a UI, que já não oferece esta ação a ele), o INSERT em
-- `sales` pode passar (RLS permite), mas o INSERT em `sale_installments`
-- falha com 42501 e a transação inteira é revertida — nenhuma venda órfã é
-- criada mesmo nesse cenário. Isso foi verificado manualmente (ver relatório
-- final, seção Q).
--
-- seller_id e course_id NÃO são recebidos como parâmetro do cliente: são
-- sempre derivados server-side a partir de students.created_by (PDF seção 4:
-- "o sistema deverá vincular automaticamente a venda ao vendedor que
-- realizou o cadastro do aluno") e classes.course_id (via a matrícula
-- selecionada), para impedir que o client envie um vendedor/curso
-- inconsistente com a matrícula.
--
-- goal_amount / goal_student_count (colunas NOT NULL já existentes desde a
-- Fase 02, comentadas em 20260811120400_sales_goals.sql) são calculados
-- aqui, não recebidos do client, seguindo literalmente a "Regra de Apuração
-- das Metas" do PDF seção 5: à vista/cartão = 100% do valor da venda;
-- boleto = valor da 1ª parcela. Isso NÃO implementa o módulo de Metas (não
-- há leitura/atualização de public.goals aqui) — apenas preenche
-- corretamente colunas que já existem e já são NOT NULL.
--
-- IMPACTO:
-- Nenhuma tabela/coluna/policy existente é alterada. Apenas uma função nova
-- é criada. Não afeta nenhum fluxo das Fases 01–10.
--
-- POR QUE NÃO É POSSÍVEL RESOLVER NA APLICAÇÃO:
-- O frontend não tem como garantir atomicidade entre dois INSERTs
-- independentes via PostgREST (não há transação entre chamadas HTTP
-- separadas). Sem esta função, uma falha de rede/validação entre o INSERT de
-- `sales` e o de `sale_installments` deixaria uma venda sem parcelas no
-- banco, exigindo limpeza manual.
-- =============================================================================
create or replace function public.create_sale_with_installments(
  p_enrollment_id uuid,
  p_total_amount numeric,
  p_payment_method public.payment_method,
  p_payment_plan text,
  p_sale_date date,
  p_installments jsonb -- array de {"installment_number": 1, "amount": 333.34, "due_date": "2026-09-12"}
)
returns uuid
language plpgsql
as $$
declare
  v_student_id uuid;
  v_course_id uuid;
  v_seller_id uuid;
  v_sale_id uuid;
  v_goal_amount numeric(12, 2);
  v_first_installment_amount numeric(12, 2);
  v_installment jsonb;
begin
  select e.student_id, c.course_id
    into v_student_id, v_course_id
    from public.enrollments e
    join public.classes c on c.id = e.class_id
   where e.id = p_enrollment_id;

  if v_student_id is null then
    raise exception 'Matrícula não encontrada.';
  end if;

  select s.created_by into v_seller_id from public.students s where s.id = v_student_id;

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
    p_enrollment_id, v_student_id, v_seller_id, v_course_id,
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

  return v_sale_id;
end;
$$;

comment on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb) is
  'Cria venda + parcelas em uma única transação (evita venda órfã sem parcelas). SECURITY INVOKER — RLS de sales/sale_installments continua sendo a autoridade real. seller_id/course_id/goal_amount são derivados server-side, nunca recebidos do client.';

revoke all on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb) from public;
grant execute on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb) to authenticated;
