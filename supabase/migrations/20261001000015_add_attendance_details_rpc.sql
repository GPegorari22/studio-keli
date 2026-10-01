-- Retorna histórico de presença e financeiro do aluno autenticado.
create or replace function public.detalhes_frequencia_aluno()
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
      ), '[]'::jsonb)
    )
  );
end;
$$;

grant execute on function public.detalhes_frequencia_aluno() to authenticated;
