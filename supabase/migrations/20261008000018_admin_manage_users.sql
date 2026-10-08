-- Cadastro de administradores e permissões individuais do painel.
create table if not exists public.admin_usuario_permissao (
  id_usuario uuid primary key references auth.users(id) on delete cascade,
  financeiro boolean not null default true,
  notificacoes boolean not null default true,
  relatorios boolean not null default true,
  usuarios boolean not null default false,
  loja boolean not null default true,
  atualizado_em timestamptz not null default now()
);

create or replace function public.admin_listar_usuarios_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id_usuario', u.id_usuario,
      'nome', u.nome,
      'email', u.email,
      'status', coalesce(u.status, 'ativo'),
      'perfil', coalesce(p.nome, 'Administrador'),
      'acesso', coalesce(p.nome, 'Administrador'),
      'ultimo_acesso', au.last_sign_in_at,
      'permissoes', jsonb_build_object(
        'financeiro', coalesce(per.financeiro, true),
        'notificacoes', coalesce(per.notificacoes, true),
        'relatorios', coalesce(per.relatorios, true),
        'usuarios', coalesce(per.usuarios, false),
        'loja', coalesce(per.loja, true)
      )
    ) order by u.nome)
    from public.usuario u
    left join public.perfil p on p.id_perfil = u.id_perfil
    left join auth.users au on au.id = u.id_usuario
    left join public.admin_usuario_permissao per on per.id_usuario = u.id_usuario
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_criar_usuario_admin(
  p_nome text,
  p_email text,
  p_senha text,
  p_permissoes jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
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
  values (novo_id, lower(trim(p_email)), trim(p_nome), perfil_admin, 'ativo');

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

create or replace function public.admin_atualizar_usuario_admin(
  p_id_usuario uuid,
  p_nome text,
  p_status text,
  p_permissoes jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.usuario where id_usuario = p_id_usuario) then
    raise exception 'Usuário não encontrado.' using errcode = 'P0002';
  end if;
  if p_id_usuario = auth.uid() and lower(coalesce(p_status, 'ativo')) <> 'ativo' then
    raise exception 'Você não pode bloquear o próprio usuário administrador.' using errcode = '42501';
  end if;

  update public.usuario
  set nome = coalesce(nullif(trim(p_nome), ''), nome),
      status = case when lower(trim(coalesce(p_status, 'ativo'))) in ('bloqueado', 'inativo') then 'bloqueado' else 'ativo' end
  where id_usuario = p_id_usuario;

  insert into public.admin_usuario_permissao (id_usuario, financeiro, notificacoes, relatorios, usuarios, loja, atualizado_em)
  values (
    p_id_usuario,
    coalesce((p_permissoes->>'financeiro')::boolean, true),
    coalesce((p_permissoes->>'notificacoes')::boolean, true),
    coalesce((p_permissoes->>'relatorios')::boolean, true),
    coalesce((p_permissoes->>'usuarios')::boolean, false),
    coalesce((p_permissoes->>'loja')::boolean, true),
    now()
  )
  on conflict (id_usuario) do update set
    financeiro = excluded.financeiro,
    notificacoes = excluded.notificacoes,
    relatorios = excluded.relatorios,
    usuarios = excluded.usuarios,
    loja = excluded.loja,
    atualizado_em = now();

  return jsonb_build_object('ok', true, 'id_usuario', p_id_usuario);
end;
$$;

revoke all on table public.admin_usuario_permissao from public;
revoke all on function public.admin_listar_usuarios_admin() from public;
revoke all on function public.admin_criar_usuario_admin(text, text, text, jsonb) from public;
revoke all on function public.admin_atualizar_usuario_admin(uuid, text, text, jsonb) from public;
grant execute on function public.admin_listar_usuarios_admin() to authenticated;
grant execute on function public.admin_criar_usuario_admin(text, text, text, jsonb) to authenticated;
grant execute on function public.admin_atualizar_usuario_admin(uuid, text, text, jsonb) to authenticated;
