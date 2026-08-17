
create table public.teachers (
  id uuid primary key default extensions.gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  subject_area text not null,
  is_active boolean not null default true,
  contract_file_path text,
  contract_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.teachers is
  'Professores cadastrados no sistema (nome, contato, área que leciona, contrato anexado).';
comment on column public.teachers.subject_area is
  'Área/disciplina que o professor leciona (texto livre).';
comment on column public.teachers.contract_file_path is
  'Caminho do objeto no bucket de Storage "teacher-contracts" (privado). Nulo quando nenhum contrato foi anexado.';

create trigger set_updated_at
  before update on public.teachers
  for each row execute function public.set_updated_at();

create table public.class_teachers (
  id uuid primary key default extensions.gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint class_teachers_unique unique (class_id, teacher_id)
);

comment on table public.class_teachers is
  'Vínculo N:N entre professores e turmas que eles administram.';

create index idx_teachers_is_active on public.teachers (is_active);
create index idx_class_teachers_class_id on public.class_teachers (class_id);
create index idx_class_teachers_teacher_id on public.class_teachers (teacher_id);

-- -----------------------------------------------------------------------------
-- RLS — leitura e escrita restritas ao Gerente.
-- -----------------------------------------------------------------------------
alter table public.teachers enable row level security;
alter table public.class_teachers enable row level security;

create policy teachers_select_manager
  on public.teachers
  for select
  to authenticated
  using (public.is_manager());

create policy teachers_insert_manager
  on public.teachers
  for insert
  to authenticated
  with check (public.is_manager());

create policy teachers_update_manager
  on public.teachers
  for update
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy teachers_delete_manager
  on public.teachers
  for delete
  to authenticated
  using (public.is_manager());

create policy class_teachers_select_manager
  on public.class_teachers
  for select
  to authenticated
  using (public.is_manager());

create policy class_teachers_insert_manager
  on public.class_teachers
  for insert
  to authenticated
  with check (public.is_manager());

create policy class_teachers_delete_manager
  on public.class_teachers
  for delete
  to authenticated
  using (public.is_manager());

-- -----------------------------------------------------------------------------
-- Storage — bucket privado para os contratos anexados.
-- Sem policy de UPDATE: o app sempre substitui o contrato fazendo
-- upload de um novo objeto e apagando o antigo (delete + insert), nunca
-- sobrescreve em lugar.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-contracts',
  'teacher-contracts',
  false,
  10485760, -- 10 MiB
  array['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy teacher_contracts_select_manager
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'teacher-contracts' and public.is_manager());

create policy teacher_contracts_insert_manager
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'teacher-contracts' and public.is_manager());

create policy teacher_contracts_delete_manager
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'teacher-contracts' and public.is_manager());
