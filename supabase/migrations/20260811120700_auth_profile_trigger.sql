-- =============================================================================
-- Fase 02 — Criação automática de profile a partir de auth.users
--
-- O fluxo de login/cadastro de usuário ainda NÃO foi definido/implementado
-- nesta etapa (será feito em fase futura). Esta migration apenas prepara a
-- estrutura: sempre que um usuário for criado no Supabase Auth, um registro
-- correspondente em public.profiles é criado automaticamente.
--
-- O role é lido de raw_user_meta_data->>'role' (metadata enviado no momento do
-- signUp). Se ausente ou inválido, assume 'seller' como padrão seguro (menor
-- privilégio). Esta é uma decisão técnica temporária — o fluxo definitivo de
-- convite/criação de gerentes deverá ser definido na fase de autenticação.
-- =============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
begin
  begin
    v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  exception
    when others then
      v_role := null;
  end;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, ''),
    new.email,
    coalesce(v_role, 'seller')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Cria automaticamente o profile correspondente quando um usuário é criado em auth.users. Preparação para a fase de autenticação.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
