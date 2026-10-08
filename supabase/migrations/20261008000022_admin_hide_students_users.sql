-- A tela de usuários administrativos não deve listar alunos.
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
    where lower(trim(coalesce(p.nome, ''))) not in ('aluno', 'aluna')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_listar_usuarios_admin() from public;
grant execute on function public.admin_listar_usuarios_admin() to authenticated;
