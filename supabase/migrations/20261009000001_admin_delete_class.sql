-- Permite apagar uma turma pela gestao administrativa.
create or replace function public.excluir_turma_admin(p_id_turma integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if p_id_turma is null then
    raise exception 'Turma não encontrada.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.turma where id_turma = p_id_turma) then
    raise exception 'Turma não encontrada.' using errcode = 'P0002';
  end if;

  delete from public.turma where id_turma = p_id_turma;
  return jsonb_build_object('ok', true, 'id_turma', p_id_turma);
end;
$$;

revoke all on function public.excluir_turma_admin(integer) from public;
grant execute on function public.excluir_turma_admin(integer) to authenticated;
