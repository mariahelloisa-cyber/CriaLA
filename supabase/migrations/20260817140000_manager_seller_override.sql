
create or replace function public.create_student_with_enrollment(
  p_student jsonb,
  p_enrollment jsonb,
  p_seller_id uuid default null
)
returns table (student_id uuid, enrollment_id uuid)
language plpgsql
as $$
declare
  v_student_id uuid;
  v_enrollment_id uuid;
  v_created_by uuid;
begin
  v_created_by := case
    when p_seller_id is not null and public.is_manager() then p_seller_id
    else auth.uid()
  end;

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
    v_created_by
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
    v_created_by
  )
  returning id into v_enrollment_id;

  return query select v_student_id, v_enrollment_id;
end;
$$;

comment on function public.create_student_with_enrollment(jsonb, jsonb, uuid) is
  'Cria aluno + matrícula em uma única transação. p_seller_id (opcional) permite ao gerente atribuir o cadastro a outro vendedor; ignorado se quem chama não for gerente. SECURITY INVOKER — RLS de students/enrollments continua sendo a autoridade.';

revoke all on function public.create_student_with_enrollment(jsonb, jsonb, uuid) from public;
grant execute on function public.create_student_with_enrollment(jsonb, jsonb, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- create_sale_with_installments: mesmo parâmetro opcional, sobrepõe o
-- seller_id derivado de students.created_by quando informado por um gerente.
-- -----------------------------------------------------------------------------
create or replace function public.create_sale_with_installments(
  p_enrollment_id uuid,
  p_total_amount numeric,
  p_payment_method public.payment_method,
  p_payment_plan text,
  p_sale_date date,
  p_installments jsonb,
  p_seller_id uuid default null
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

  if p_seller_id is not null and public.is_manager() then
    v_seller_id := p_seller_id;
  end if;

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

comment on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb, uuid) is
  'Cria venda + parcelas em uma única transação. p_seller_id (opcional) permite ao gerente atribuir a venda a um vendedor diferente do dono do aluno; ignorado se quem chama não for gerente. SECURITY INVOKER.';

revoke all on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb, uuid) from public;
grant execute on function public.create_sale_with_installments(uuid, numeric, public.payment_method, text, date, jsonb, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- create_enrollment_with_sale: mesmo parâmetro opcional, sobrepõe o seller_id
-- da venda (a matrícula em si continua registrando created_by = auth.uid(),
-- ou seja, quem de fato criou a matrícula — só o vendedor CREDITADO na venda
-- muda).
-- -----------------------------------------------------------------------------
create or replace function public.create_enrollment_with_sale(
  p_student_id uuid,
  p_class_id uuid,
  p_enrollment_date date,
  p_expected_graduation_date date,
  p_total_amount numeric,
  p_payment_method public.payment_method,
  p_payment_plan text,
  p_sale_date date,
  p_installments jsonb,
  p_seller_id uuid default null
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

  if p_seller_id is not null and public.is_manager() then
    v_seller_id := p_seller_id;
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

comment on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb, uuid) is
  'Cria matrícula + venda + parcelas em uma única transação para um aluno já existente. p_seller_id (opcional) permite ao gerente atribuir a venda a um vendedor diferente do dono do aluno; ignorado se quem chama não for gerente. SECURITY INVOKER.';

revoke all on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb, uuid) from public;
grant execute on function public.create_enrollment_with_sale(uuid, uuid, date, date, numeric, public.payment_method, text, date, jsonb, uuid) to authenticated;
