-- Permite que administradores editem os dados básicos de um aluno pelo perfil administrativo.
create or replace function public.atualizar_dados_aluno_admin(
  p_id_aluno integer,
  p_nome text,
  p_email text,
  p_telefone text default null,
  p_cpf text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil public.aluno%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if p_id_aluno is null then
    raise exception 'Aluno inválido.';
  end if;
  if nullif(trim(p_nome), '') is null then
    raise exception 'Informe o nome completo.';
  end if;
  if nullif(trim(p_email), '') is null or position('@' in p_email) = 0 then
    raise exception 'Informe um e-mail válido.';
  end if;

  update public.aluno
  set nome = trim(p_nome),
      email = lower(trim(p_email)),
      telefone = nullif(trim(p_telefone), ''),
      cpf = nullif(trim(p_cpf), '')
  where id_aluno = p_id_aluno
  returning * into perfil;

  if perfil.id_aluno is null then
    raise exception 'Aluno não encontrado.';
  end if;

  return jsonb_build_object(
    'id', perfil.id_aluno,
    'nome', perfil.nome,
    'email', perfil.email,
    'telefone', perfil.telefone,
    'cpf', perfil.cpf,
    'foto_perfil', perfil.foto_perfil
  );
end;
$$;

revoke all on function public.atualizar_dados_aluno_admin(integer, text, text, text, text) from public;
grant execute on function public.atualizar_dados_aluno_admin(integer, text, text, text, text) to authenticated;
