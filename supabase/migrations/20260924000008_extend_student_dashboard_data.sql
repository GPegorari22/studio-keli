-- Expande o painel do aluno com dados de frequência, avaliação e financeiro.
create or replace function public.meu_painel_aluno()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  id_do_usuario uuid := auth.uid();
  aluno_atual public.aluno%rowtype;
begin
  if id_do_usuario is null then
    return jsonb_build_object('erro', 'Sessão inválida. Entre novamente para acessar seu perfil.');
  end if;

  select aluno.* into aluno_atual
  from public.aluno as aluno
  where aluno.id_usuario = id_do_usuario
  limit 1;

  if aluno_atual.id_aluno is null then
    return jsonb_build_object('erro', 'Não encontramos um perfil de aluno para este e-mail.');
  end if;

  return jsonb_build_object(
    'aluno', jsonb_build_object(
      'id', aluno_atual.id_aluno,
      'nome', aluno_atual.nome,
      'email', aluno_atual.email
    ),
    'proxima_aula', (
      select jsonb_build_object(
        'id_aula', aula.id_aula,
        'data', aula.data_aula,
        'horario_inicio', aula.horario_inicio,
        'horario_fim', aula.horario_fim,
        'turma', turma.nome,
        'modalidade', modalidade.nome
      )
      from public.aula as aula
      join public.turma as turma on turma.id_turma = aula.id_turma
      join public.modalidade as modalidade on modalidade.id_modalidade = turma.id_modalidade
      join public.matricula as matricula on matricula.id_turma = turma.id_turma
      where matricula.id_aluno = aluno_atual.id_aluno
        and lower(trim(matricula.status)) = 'ativo'
        and aula.data_aula >= current_date
      order by aula.data_aula, aula.horario_inicio
      limit 1
    ),
    'aulas', coalesce((
      select jsonb_agg(aulas_do_aluno order by (aulas_do_aluno ->> 'data'), (aulas_do_aluno ->> 'horario_inicio'))
      from (
        select jsonb_build_object(
          'id_aula', aula.id_aula,
          'data', aula.data_aula,
          'horario_inicio', aula.horario_inicio,
          'horario_fim', aula.horario_fim,
          'turma', turma.nome,
          'modalidade', modalidade.nome
        ) as aulas_do_aluno
        from public.aula as aula
        join public.turma as turma on turma.id_turma = aula.id_turma
        join public.modalidade as modalidade on modalidade.id_modalidade = turma.id_modalidade
        join public.matricula as matricula on matricula.id_turma = turma.id_turma
        where matricula.id_aluno = aluno_atual.id_aluno
          and lower(trim(matricula.status)) = 'ativo'
          and aula.data_aula between current_date - 31 and current_date + 45
        order by aula.data_aula, aula.horario_inicio
        limit 24
      ) as aulas_agendadas
    ), '[]'::jsonb),
    'frequencia', (
      select jsonb_build_object(
        'presencas', count(*) filter (where frequencia.presente),
        'faltas', count(*) filter (where not frequencia.presente),
        'justificadas', 0,
        'total', count(*),
        'percentual', case when count(*) = 0 then null else round((count(*) filter (where frequencia.presente)::numeric / count(*)::numeric) * 100) end
      )
      from public.frequencia as frequencia
      where frequencia.id_aluno = aluno_atual.id_aluno
    ),
    'historico_frequencia', coalesce((
      select jsonb_agg(registro order by (registro ->> 'data') desc)
      from (
        select jsonb_build_object(
          'id_aula', aula.id_aula,
          'data', aula.data_aula,
          'modalidade', modalidade.nome,
          'professora', professor.nome,
          'presente', frequencia.presente
        ) as registro
        from public.frequencia as frequencia
        join public.aula as aula on aula.id_aula = frequencia.id_aula
        join public.turma as turma on turma.id_turma = aula.id_turma
        join public.modalidade as modalidade on modalidade.id_modalidade = turma.id_modalidade
        left join public.professor as professor on professor.id_professor = turma.id_professor
        where frequencia.id_aluno = aluno_atual.id_aluno
        order by aula.data_aula desc
        limit 24
      ) as historico
    ), '[]'::jsonb),
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
      select jsonb_agg(jsonb_build_object('nome', criterio.nome, 'nota', avaliacao_criterio.nota, 'observacao', avaliacao_criterio.observacao) order by criterio.nome)
      from public.avaliacao_criterio as avaliacao_criterio
      join public.criterio_avaliacao as criterio on criterio.id_criterio = avaliacao_criterio.id_criterio
      where avaliacao_criterio.id_avaliacao = (
        select avaliacao.id_avaliacao
        from public.avaliacao as avaliacao
        where avaliacao.id_aluno = aluno_atual.id_aluno
        order by avaliacao.data_avaliacao desc, avaliacao.id_avaliacao desc
        limit 1
      )
    ), '[]'::jsonb),
    'financeiro', jsonb_build_object(
      'proximo_vencimento', (
        select jsonb_build_object('competencia', mensalidade.competencia, 'vencimento', mensalidade.vencimento, 'valor', mensalidade.valor, 'status', mensalidade.status)
        from public.mensalidade as mensalidade
        where mensalidade.id_aluno = aluno_atual.id_aluno
          and lower(trim(mensalidade.status)) not in ('pago', 'quitado')
        order by mensalidade.vencimento
        limit 1
      ),
      'total_pago_ano', coalesce((
        select sum(pagamento.valor)
        from public.pagamento as pagamento
        join public.mensalidade as mensalidade on mensalidade.id_mensalidade = pagamento.id_mensalidade
        where mensalidade.id_aluno = aluno_atual.id_aluno
          and extract(year from pagamento.data_pagamento) = extract(year from current_date)
      ), 0),
      'mensalidades', coalesce((
        select jsonb_agg(jsonb_build_object('competencia', mensalidade.competencia, 'vencimento', mensalidade.vencimento, 'valor', mensalidade.valor, 'status', mensalidade.status) order by mensalidade.vencimento desc)
        from public.mensalidade as mensalidade
        where mensalidade.id_aluno = aluno_atual.id_aluno
        limit 12
      ), '[]'::jsonb)
    )
  );
end;
$$;

grant execute on function public.meu_painel_aluno() to authenticated;
