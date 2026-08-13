-- =============================================================================
-- Fase 19 — CPF único em students
--
-- Decisão confirmada pelo usuário: CPF identifica o ALUNO, não a matrícula.
-- Um aluno pode ter várias matrículas (enrollments), mas não pode existir
-- mais de uma linha em students com o mesmo CPF. Não criamos UNIQUE em
-- (student_id, class_id) nem em nenhuma coluna de enrollments — múltiplas
-- matrículas do mesmo aluno continuam permitidas normalmente.
--
-- students.cpf continua NULLABLE (cadastro sem CPF é permitido desde a Fase
-- 02) — UNIQUE em Postgres não conflita entre múltiplos NULLs, só entre
-- valores iguais não-nulos. cpf já é normalizado para dígitos (onlyDigits())
-- pelo client antes de qualquer insert/update (students.service.ts), então
-- não há necessidade de normalizar aqui.
--
-- SEGURANÇA CONTRA DADOS REAIS DUPLICADOS: esta migration NUNCA apaga, mescla
-- ou altera uma linha de students. Antes de criar a constraint, ela roda uma
-- verificação e ABORTA (RAISE EXCEPTION) com a lista de CPFs duplicados, se
-- houver algum — a constraint só é criada se a verificação não encontrar
-- nenhum conflito. Rodar esta migration é, portanto, a própria auditoria:
-- se falhar, nada muda no banco (a transação inteira é revertida) e a
-- mensagem de erro lista exatamente quais CPFs colidem, para resolução
-- manual antes de tentar novamente.
-- =============================================================================
do $$
declare
  v_conflicts text;
begin
  select string_agg(format('%s (%s alunos)', cpf, cnt), ', ')
    into v_conflicts
    from (
      select cpf, count(*) as cnt
        from public.students
       where cpf is not null
       group by cpf
      having count(*) > 1
    ) dup;

  if v_conflicts is not null then
    raise exception
      'Não é possível criar a constraint UNIQUE em students.cpf: existem CPFs duplicados (%). Resolva manualmente antes de reexecutar esta migration — nenhum dado foi alterado.',
      v_conflicts;
  end if;
end $$;

alter table public.students
  add constraint students_cpf_unique unique (cpf);

comment on constraint students_cpf_unique on public.students is
  'CPF identifica o aluno (Fase 19). NULL permitido (cadastro sem CPF); múltiplos NULLs não conflitam entre si. Não afeta enrollments — um aluno continua podendo ter várias matrículas.';
