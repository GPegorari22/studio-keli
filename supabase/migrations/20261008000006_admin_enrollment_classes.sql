-- Lista turmas com modalidade e professora para o formulário de matrícula.
create or replace function public.listar_turmas_admin()
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
      'id', t.id_turma,
      'nome', t.nome,
      'modalidade', m.nome,
      'professora', p.nome,
      'dia', t.dia_semana,
      'horario', t.horario,
      'capacidade', t.capacidade,
      'status', t.status
    ) order by m.nome, t.nome)
    from public.turma t
    left join public.modalidade m on m.id_modalidade = t.id_modalidade
    left join public.professor p on p.id_professor = t.id_professor
    where lower(trim(coalesce(t.status, 'ativo'))) in ('ativo', 'ativa')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.listar_turmas_admin() from public;
grant execute on function public.listar_turmas_admin() to authenticated;
