-- Não exibe pré-cadastros que já foram convertidos em alunos.
create or replace function public.listar_possiveis_alunos_admin()
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
      'id', pa.id_possivel_aluno,
      'id_possivel_aluno', pa.id_possivel_aluno,
      'nome', pa.nome,
      'email', pa.email,
      'telefone', pa.telefone,
      'data_nascimento', pa.data_nascimento,
      'nome_responsavel', pa.nome_responsavel,
      'telefone_responsavel', pa.telefone_responsavel,
      'observacoes', pa.observacoes,
      'status', pa.status,
      'data_aula_experimental', pa.data_aula_experimental,
      'horario_aula_experimental', pa.horario_aula_experimental,
      'id_turma', pa.id_turma,
      'turma', t.nome,
      'modalidade', m.nome
    ) order by pa.data_contato desc nulls last, pa.id_possivel_aluno desc)
    from public.possivel_aluno pa
    left join public.turma t on t.id_turma = pa.id_turma
    left join public.modalidade m on m.id_modalidade = t.id_modalidade
    where lower(trim(coalesce(pa.origem, ''))) = 'site - aula experimental'
      and lower(trim(coalesce(pa.status, ''))) in ('novo', 'pendente')
      and (
        pa.email is null
        or not exists (
          select 1
          from public.aluno a
          where lower(trim(coalesce(a.email, ''))) = lower(trim(pa.email))
        )
      )
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.listar_possiveis_alunos_admin() from public;
grant execute on function public.listar_possiveis_alunos_admin() to authenticated;
