
alter table public.courses
  add column total_units integer;

alter table public.courses
  add constraint courses_total_units_positive check (total_units is null or total_units > 0);

comment on column public.courses.total_units is
  'Quantidade de unidades (semestres) do curso. Opcional, nullable.';
