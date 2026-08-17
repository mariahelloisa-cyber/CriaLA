-- =============================================================================
-- SouCriaLA — Seed para o Supabase SQL Editor
--
-- Conteúdo idêntico a supabase/seed.sql (mantido como arquivo separado do
-- schema, conforme solicitado). Execute SOMENTE depois de:
--   1. supabase/remote-setup.sql
--   2. supabase/verify-remote.sql (conferir que tudo foi criado corretamente)
--
-- Apenas as 6 categorias de curso fixas do PDF são inseridas. Nenhum
-- vendedor, aluno, turma, venda ou meta fictícios. Idempotente — pode ser
-- executado mais de uma vez sem duplicar linhas (ON CONFLICT DO NOTHING).
-- =============================================================================

insert into public.course_categories (name, slug) values
  ('EJA', 'eja'),
  ('Curso Técnico', 'curso-tecnico'),
  ('Curso Superior', 'curso-superior'),
  ('Curso SouCria', 'curso-soucria'),
  ('Pós-graduação', 'pos-graduacao'),
  ('Pós Técnico', 'pos-tecnico')
on conflict (slug) do nothing;
