-- =============================================================================
-- Dados de teste fictícios — NÃO faz parte do seed.sql oficial (que só tem
-- as categorias fixas do PDF). Este arquivo é opcional, roda separado, e não
-- é executado automaticamente por `supabase db reset`.
--
-- Baseado no mesmo conjunto de personas fictícias já usado no projeto
-- (5 vendedores, 6 turmas, 12 alunos, 12 vendas) — mesmos nomes/CPFs/valores
-- do protótipo de referência combinado com o usuário.
--
-- IDEMPOTENTE: cada bloco só insere o que ainda não existe (por chave
-- natural — nome de unidade/curso/turma, CPF de aluno, enrollment_id de
-- venda). Seguro rodar mais de uma vez.
--
-- PRÉ-REQUISITO: os 5 vendedores abaixo já devem existir em public.profiles
-- com esses nomes EXATOS (criados via Supabase Auth — não é possível criar
-- usuários de autenticação por SQL puro). Rode a query de verificação no
-- topo antes do resto — se algum nome não aparecer, ajuste o nome no bloco
-- correspondente ou cadastre o vendedor antes de continuar.
--   Ana Beatriz Lima · Carlos Eduardo Souza · Juliana Ferreira ·
--   Marcos Antônio Reis · Priscila Nogueira
-- =============================================================================

-- Verificação (rode antes e confira o resultado — deve trazer 5 linhas)
select full_name, id from public.profiles
where full_name in (
  'Ana Beatriz Lima', 'Carlos Eduardo Souza', 'Juliana Ferreira',
  'Marcos Antônio Reis', 'Priscila Nogueira'
)
order by full_name;

-- -----------------------------------------------------------------------------
-- 1. Unidades
-- -----------------------------------------------------------------------------
insert into public.units (name, is_active)
select v.name, true
from (values ('Unidade Centro'), ('Unidade Norte'), ('Unidade Sul')) as v(name)
where not exists (select 1 from public.units u where u.name = v.name);

-- -----------------------------------------------------------------------------
-- 2. Cursos (vinculados às categorias fixas já existentes)
-- -----------------------------------------------------------------------------
insert into public.courses (name, category_id, is_active)
select v.name, cc.id, true
from (values
  ('Técnico em Enfermagem', 'curso-tecnico'),
  ('EJA Ensino Médio', 'eja'),
  ('Administração', 'curso-superior'),
  ('Design Criativo SouCria', 'curso-soucria'),
  ('Pós em Gestão de Pessoas', 'pos-graduacao'),
  ('Pós Técnico em Segurança do Trabalho', 'pos-tecnico')
) as v(name, slug)
join public.course_categories cc on cc.slug = v.slug
where not exists (select 1 from public.courses c where c.name = v.name);

-- -----------------------------------------------------------------------------
-- 3. Turmas (inclui capacity — coluna adicionada na migration de 2026-08-13)
-- -----------------------------------------------------------------------------
insert into public.classes (name, course_id, unit_id, start_date, end_date, status, capacity)
select v.name, c.id, u.id, v.start_date::date, v.end_date::date, v.status::public.class_status, v.capacity
from (values
  ('TEC-ENF-2026A', 'Técnico em Enfermagem', 'Unidade Centro', '2026-02-10', '2027-06-30', 'in_progress', 40),
  ('EJA-NOITE-2026', 'EJA Ensino Médio', 'Unidade Norte', '2026-03-02', '2026-12-18', 'in_progress', 50),
  ('SUP-ADM-2026B', 'Administração', 'Unidade Centro', '2026-08-05', '2030-07-20', 'open', 60),
  ('SC-DESIGN-08', 'Design Criativo SouCria', 'Unidade Sul', '2026-04-15', '2026-10-15', 'in_progress', 30),
  ('POS-GEST-2026', 'Pós em Gestão de Pessoas', 'Unidade Centro', '2026-09-01', '2027-09-01', 'open', 35),
  ('PTEC-SEG-2025', 'Pós Técnico em Segurança do Trabalho', 'Unidade Sul', '2025-08-11', '2026-08-10', 'closed', 25)
) as v(name, course_name, unit_name, start_date, end_date, status, capacity)
join public.courses c on c.name = v.course_name
join public.units u on u.name = v.unit_name
where not exists (select 1 from public.classes cl where cl.name = v.name);

-- -----------------------------------------------------------------------------
-- 4. Alunos + Matrículas (idempotente por CPF)
-- created_by = vendedor responsável, resolvido por nome (ver pré-requisito).
-- -----------------------------------------------------------------------------
with novos_alunos(full_name, cpf, phone, email, city, state, class_name, seller_name, enrollment_date, expected_graduation_date, status) as (
  values
    ('Beatriz Alves Moura', '12345678901', '11988123344', 'beatriz.moura@email.com', 'São Paulo', 'SP', 'TEC-ENF-2026A', 'Carlos Eduardo Souza', '2026-02-05'::date, '2027-06-30'::date, 'active'::public.enrollment_status),
    ('Rafael Nunes Barbosa', '23456789012', '11991238877', 'rafael.barbosa@email.com', 'Guarulhos', 'SP', 'EJA-NOITE-2026', 'Ana Beatriz Lima', '2026-02-27', '2026-12-18', 'active'),
    ('Camila Rodrigues Pinto', '34567890123', '11977442211', 'camila.pinto@email.com', 'São Paulo', 'SP', 'SUP-ADM-2026B', 'Carlos Eduardo Souza', '2026-07-12', '2030-07-20', 'active'),
    ('Diego Martins Correia', '45678901234', '11966551100', 'diego.correia@email.com', 'Osasco', 'SP', 'SC-DESIGN-08', 'Juliana Ferreira', '2026-04-02', '2026-10-15', 'active'),
    ('Larissa Gomes Teixeira', '56789012345', '11955663322', 'larissa.teixeira@email.com', 'São Paulo', 'SP', 'POS-GEST-2026', 'Carlos Eduardo Souza', '2026-08-18', '2027-09-01', 'active'),
    ('Pedro Henrique Ramos', '67890123456', '11944779988', 'pedro.ramos@email.com', 'Diadema', 'SP', 'PTEC-SEG-2025', 'Marcos Antônio Reis', '2025-08-01', '2026-08-10', 'completed'),
    ('Vanessa Cardoso Lima', '78901234567', '11933887766', 'vanessa.lima@email.com', 'São Paulo', 'SP', 'TEC-ENF-2026A', 'Carlos Eduardo Souza', '2026-02-08', '2027-06-30', 'active'),
    ('Tiago Oliveira Prado', '89012345678', '11922994455', 'tiago.prado@email.com', 'Santo André', 'SP', 'EJA-NOITE-2026', 'Priscila Nogueira', '2026-03-01', '2026-12-18', 'active'),
    ('Amanda Freitas Silveira', '90123456789', '11911002233', 'amanda.silveira@email.com', 'São Paulo', 'SP', 'SC-DESIGN-08', 'Ana Beatriz Lima', '2026-04-20', '2026-10-15', 'active'),
    ('Gustavo Henrique Dias', '01234567890', '11900115566', 'gustavo.dias@email.com', 'São Paulo', 'SP', 'SUP-ADM-2026B', 'Juliana Ferreira', '2026-07-30', '2030-07-20', 'active'),
    ('Isabela Santos Rocha', '11122233344', '11988771234', 'isabela.rocha@email.com', 'Barueri', 'SP', 'TEC-ENF-2026A', 'Carlos Eduardo Souza', '2026-06-11', '2027-06-30', 'active'),
    ('Wesley Aparecido Nunes', '22233344455', '11977664321', 'wesley.nunes@email.com', 'São Paulo', 'SP', 'POS-GEST-2026', 'Marcos Antônio Reis', '2026-08-03', '2027-09-01', 'active')
),
filtrados as (
  select na.*, p.id as seller_id, c.id as class_id
  from novos_alunos na
  join public.profiles p on p.full_name = na.seller_name
  join public.classes c on c.name = na.class_name
  where not exists (select 1 from public.students s where s.cpf = na.cpf)
),
alunos_inseridos as (
  insert into public.students (full_name, cpf, phone, email, city, state, created_by)
  select full_name, cpf, phone, email, city, state, seller_id
  from filtrados
  returning id, cpf, created_by
)
insert into public.enrollments (student_id, class_id, enrollment_date, expected_graduation_date, status, created_by)
select ai.id, f.class_id, f.enrollment_date, f.expected_graduation_date, f.status, ai.created_by
from alunos_inseridos ai
join filtrados f on f.cpf = ai.cpf;

-- -----------------------------------------------------------------------------
-- 5. Vendas + Parcelas (idempotente — sales.enrollment_id é UNIQUE)
-- goal_amount segue a regra real (boleto = 1ª parcela; à vista/cartão = 100%
-- do valor) — mesma lógica de create_sale_with_installments, não inventada
-- aqui. Todas as parcelas nascem "pending" (nenhum pagamento fictício
-- marcado como já pago) — teste o fluxo de "marcar como pago" manualmente
-- se precisar.
-- -----------------------------------------------------------------------------
with vendas_prototipo(cpf, valor_total, forma, plano, installment_count, data_venda, seller_name, course_name) as (
  values
    ('12345678901', 4800.00, 'bank_slip'::public.payment_method, '12x de R$ 400,00', 12, '2026-02-05'::date, 'Carlos Eduardo Souza', 'Técnico em Enfermagem'),
    ('23456789012', 1200.00, 'cash'::public.payment_method, 'Pagamento único', 1, '2026-02-27', 'Ana Beatriz Lima', 'EJA Ensino Médio'),
    ('34567890123', 9600.00, 'credit_card'::public.payment_method, '12x de R$ 800,00', 12, '2026-07-12', 'Carlos Eduardo Souza', 'Administração'),
    ('45678901234', 2400.00, 'bank_slip'::public.payment_method, '6x de R$ 400,00', 6, '2026-04-02', 'Juliana Ferreira', 'Design Criativo SouCria'),
    ('56789012345', 7200.00, 'credit_card'::public.payment_method, '10x de R$ 720,00', 10, '2026-08-18', 'Carlos Eduardo Souza', 'Pós em Gestão de Pessoas'),
    ('67890123456', 3600.00, 'bank_slip'::public.payment_method, '12x de R$ 300,00', 12, '2025-08-01', 'Marcos Antônio Reis', 'Pós Técnico em Segurança do Trabalho'),
    ('78901234567', 4800.00, 'cash'::public.payment_method, 'Pagamento único', 1, '2026-02-08', 'Carlos Eduardo Souza', 'Técnico em Enfermagem'),
    ('89012345678', 1200.00, 'bank_slip'::public.payment_method, '10x de R$ 120,00', 10, '2026-03-01', 'Priscila Nogueira', 'EJA Ensino Médio'),
    ('90123456789', 2400.00, 'credit_card'::public.payment_method, '8x de R$ 300,00', 8, '2026-04-20', 'Ana Beatriz Lima', 'Design Criativo SouCria'),
    ('01234567890', 9600.00, 'bank_slip'::public.payment_method, '24x de R$ 400,00', 24, '2026-07-30', 'Juliana Ferreira', 'Administração'),
    ('11122233344', 4800.00, 'credit_card'::public.payment_method, '12x de R$ 400,00', 12, '2026-06-11', 'Carlos Eduardo Souza', 'Técnico em Enfermagem'),
    ('22233344455', 7200.00, 'cash'::public.payment_method, 'Pagamento único', 1, '2026-08-03', 'Marcos Antônio Reis', 'Pós em Gestão de Pessoas')
),
filtradas as (
  select
    vp.*,
    e.id as enrollment_id,
    s.id as student_id,
    p.id as seller_id,
    c.id as course_id,
    case when vp.forma = 'bank_slip' then round(vp.valor_total / vp.installment_count, 2) else vp.valor_total end as goal_amount
  from vendas_prototipo vp
  join public.students s on s.cpf = vp.cpf
  join public.enrollments e on e.student_id = s.id
  join public.profiles p on p.full_name = vp.seller_name
  join public.courses c on c.name = vp.course_name
  where not exists (select 1 from public.sales sa where sa.enrollment_id = e.id)
),
vendas_inseridas as (
  insert into public.sales (enrollment_id, student_id, seller_id, course_id, total_amount, payment_method, payment_plan, sale_date, goal_amount, goal_student_count)
  select enrollment_id, student_id, seller_id, course_id, valor_total, forma, plano, data_venda, goal_amount, 1
  from filtradas
  returning id, enrollment_id, total_amount, sale_date
),
-- Gera N parcelas mensais por venda (mesma técnica de divisão do sale-form.tsx: ajusta a última parcela para a soma bater com o total).
-- Reassocia por enrollment_id (UNIQUE em sales) em vez de valor+data, que poderia colidir.
parcelas_geradas as (
  select
    vi.id as sale_id,
    gs.n as installment_number,
    f.installment_count,
    (vi.sale_date + ((gs.n - 1) * interval '1 month'))::date as due_date,
    case
      when gs.n < f.installment_count then round(vi.total_amount / f.installment_count, 2)
      else vi.total_amount - round(vi.total_amount / f.installment_count, 2) * (f.installment_count - 1)
    end as amount
  from vendas_inseridas vi
  join filtradas f on f.enrollment_id = vi.enrollment_id
  join lateral generate_series(1, f.installment_count) as gs(n) on true
)
insert into public.sale_installments (sale_id, installment_number, amount, due_date, status)
select sale_id, installment_number, amount, due_date, 'pending'::public.installment_status
from parcelas_geradas;

-- -----------------------------------------------------------------------------
-- 6. Metas do mês atual (idempotente — goals tem UNIQUE(seller_id, mês, ano))
-- -----------------------------------------------------------------------------
insert into public.goals (seller_id, reference_month, reference_year, financial_target, student_target)
select p.id, extract(month from current_date)::int, extract(year from current_date)::int, v.financial_target, v.student_target
from (values
  ('Ana Beatriz Lima', 24000.00, 20),
  ('Carlos Eduardo Souza', 20000.00, 18),
  ('Juliana Ferreira', 18000.00, 16),
  ('Marcos Antônio Reis', 16000.00, 14),
  ('Priscila Nogueira', 15000.00, 12)
) as v(seller_name, financial_target, student_target)
join public.profiles p on p.full_name = v.seller_name
where not exists (
  select 1 from public.goals g
  where g.seller_id = p.id
    and g.reference_month = extract(month from current_date)::int
    and g.reference_year = extract(year from current_date)::int
);
