-- Permite ativar ou desativar um aluno pela gestão de pessoas.
create or replace function public.admin_alterar_status_aluno(
  p_id_aluno integer,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  aluno_atual public.aluno%rowtype;
  status_normalizado text := lower(trim(coalesce(p_status, '')));
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if status_normalizado not in ('ativo', 'inativo') then
    raise exception 'Status do aluno inválido.' using errcode = '22023';
  end if;

  update public.aluno
  set status = case when status_normalizado = 'ativo' then 'Ativo' else 'Inativo' end
  where id_aluno = p_id_aluno
  returning * into aluno_atual;

  if aluno_atual.id_aluno is null then
    raise exception 'Aluno não encontrado.' using errcode = 'P0002';
  end if;

  return jsonb_build_object('ok', true, 'id_aluno', aluno_atual.id_aluno, 'status', aluno_atual.status);
end;
$$;

revoke all on function public.admin_alterar_status_aluno(integer, text) from public;
grant execute on function public.admin_alterar_status_aluno(integer, text) to authenticated;
