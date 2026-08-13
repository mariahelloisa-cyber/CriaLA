-- =============================================================================
-- Fase 19 — get_my_seller_rank
--
-- CONTEXTO (retomando um gap documentado desde a Fase 14): "Ranking pessoal"
-- do vendedor (saber a própria posição entre todos os vendedores) foi
-- deliberadamente NÃO implementado na Fase 14 porque `sales_select`/
-- `goals_select` restringem a sessão de um vendedor às próprias linhas —
-- calcular "você é o 3º de 8" exige comparar com o total de outros
-- vendedores, que o client de um vendedor literalmente não consegue ler. A
-- única correção correta identificada na época era uma função
-- SECURITY DEFINER que devolve SÓ a posição/números do próprio chamador,
-- nunca os dados dos demais — exatamente o que esta função faz.
--
-- O ranking completo do GERENTE (todos os vendedores, valor, % da meta) NÃO
-- precisa de RPC nova — `sales_select`/`goals_select` já permitem a um
-- gerente ler todas as linhas via RLS normal, e o cálculo continua 100% no
-- client (goals.service.ts:listSellerGoalSummariesForRange/summarizeSellers),
-- reaproveitando a mesma regra de apuração já centralizada (goal_amount/
-- goal_student_count). Esta função serve só o caso do vendedor.
--
-- SEGURANÇA:
--   - SECURITY DEFINER (necessário para o cálculo interno enxergar todos os
--     vendedores) + search_path = '' + todo objeto referenciado com schema
--     explícito, mesmo padrão anti-sequestro de is_manager()/is_seller().
--   - A função verifica public.is_seller() e recusa (RAISE EXCEPTION) para
--     qualquer chamador que não seja vendedor ativo — gerente já tem o
--     ranking completo por RLS normal, não precisa (nem deve) chamar isto.
--   - O `return query` final filtra explicitamente `where seller_id =
--     auth.uid()` — mesmo com acesso interno irrestrito (via SECURITY
--     DEFINER), a função NUNCA devolve nome, id ou valores de outro
--     vendedor. Só posição (inteiro), total de vendedores (inteiro) e os
--     próprios valores do chamador saem da função.
--   - Usa a mesma regra financeira já centralizada (sales.goal_amount /
--     goal_student_count) — nenhum recálculo novo.
--   - Empate: mesmo critério determinístico do ranking do gerente (valor
--     desc, depois nome, depois id) — ver goals.service.ts:rankSellersByValue.
-- =============================================================================
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

comment on function public.get_my_seller_rank(date, date) is
  'Fase 19: posição do vendedor chamador no ranking do período [p_from, p_to], sem expor dados de outros vendedores. SECURITY DEFINER só para o cálculo interno; retorno sempre filtrado a auth.uid(). Reaproveita sales.goal_amount/goal_student_count (mesma regra de apuração de metas/vendas já centralizada).';

revoke all on function public.get_my_seller_rank(date, date) from public;
grant execute on function public.get_my_seller_rank(date, date) to authenticated;
