

insert into public.course_categories (name, slug) values
  ('EJA', 'eja'),
  ('Curso Técnico', 'curso-tecnico'),
  ('Curso Superior', 'curso-superior'),
  ('Curso SouCria', 'curso-soucria'),
  ('Pós-graduação', 'pos-graduacao'),
  ('Pós Técnico', 'pos-tecnico')
on conflict (slug) do nothing;
