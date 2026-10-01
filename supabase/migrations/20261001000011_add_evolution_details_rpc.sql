-- Dados específicos da tela de evolução, independentes do payload geral do dashboard.
create or replace function public.detalhes_evolucao_aluno()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  aluno_atual public.aluno%rowtype;
begin
  select aluno.* into aluno_atual
  from public.aluno as aluno
  where aluno.id_usuario = auth.uid()
  limit 1;

  if aluno_atual.id_aluno is null then
    return jsonb_build_object('erro', 'Não encontramos um perfil de aluno para este e-mail.');
  end if;

  return jsonb_build_object(
    'avaliacao', (
      select jsonb_build_object(
        'data', avaliacao.data_avaliacao,
        'metas', avaliacao.metas,
        'observacoes', avaliacao.observacoes
      )
      from public.avaliacao as avaliacao
      where avaliacao.id_aluno = aluno_atual.id_aluno
      order by avaliacao.data_avaliacao desc, avaliacao.id_avaliacao desc
      limit 1
    ),
    'criterios', coalesce((
      select jsonb_agg(
        jsonb_build_object('nome', criterio.nome, 'nota', avaliacao_criterio.nota, 'observacao', avaliacao_criterio.observacao)
        order by criterio.nome
      )
      from public.avaliacao_criterio as avaliacao_criterio
      join public.criterio_avaliacao as criterio on criterio.id_criterio = avaliacao_criterio.id_criterio
      where avaliacao_criterio.id_avaliacao = (
        select avaliacao.id_avaliacao
        from public.avaliacao as avaliacao
        where avaliacao.id_aluno = aluno_atual.id_aluno
        order by avaliacao.data_avaliacao desc, avaliacao.id_avaliacao desc
        limit 1
      )
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.detalhes_evolucao_aluno() to authenticated;
