-- O trigger de Auth pode criar public.usuario automaticamente; use upsert no cadastro administrativo.
create or replace function public.admin_criar_usuario_admin(
  p_nome text,
  p_email text,
  p_senha text,
  p_permissoes jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  novo_id uuid := gen_random_uuid();
  perfil_admin integer;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if nullif(trim(p_nome), '') is null or nullif(trim(p_email), '') is null then
    raise exception 'Informe nome e e-mail.' using errcode = '22023';
  end if;
  if p_senha is null or char_length(p_senha) < 6 then
    raise exception 'A senha deve ter pelo menos 6 caracteres.' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where lower(email) = lower(trim(p_email))) then
    raise exception 'Já existe um usuário com este e-mail.' using errcode = '23505';
  end if;

  select id_perfil into perfil_admin
  from public.perfil
  where lower(trim(nome)) in ('administrador', 'admin')
  order by id_perfil
  limit 1;
  if perfil_admin is null then
    raise exception 'Perfil Administrador não encontrado.';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    novo_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    lower(trim(p_email)), crypt(p_senha, gen_salt('bf')), now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', trim(p_nome)), now(), now()
  );

  insert into public.usuario (id_usuario, email, nome, id_perfil, status)
  values (novo_id, lower(trim(p_email)), trim(p_nome), perfil_admin, 'ativo')
  on conflict (id_usuario) do update set
    email = excluded.email,
    nome = excluded.nome,
    id_perfil = excluded.id_perfil,
    status = excluded.status;

  insert into public.admin_usuario_permissao (id_usuario, financeiro, notificacoes, relatorios, usuarios, loja)
  values (
    novo_id,
    coalesce((p_permissoes->>'financeiro')::boolean, true),
    coalesce((p_permissoes->>'notificacoes')::boolean, true),
    coalesce((p_permissoes->>'relatorios')::boolean, true),
    coalesce((p_permissoes->>'usuarios')::boolean, false),
    coalesce((p_permissoes->>'loja')::boolean, true)
  );

  return jsonb_build_object('ok', true, 'id_usuario', novo_id);
end;
$$;

revoke all on function public.admin_criar_usuario_admin(text, text, text, jsonb) from public;
grant execute on function public.admin_criar_usuario_admin(text, text, text, jsonb) to authenticated;
