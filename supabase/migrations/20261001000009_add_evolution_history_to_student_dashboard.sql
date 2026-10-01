-- Disponibiliza o histórico real de avaliações para o gráfico de trajetória do aluno.
create or replace function public.historico_evolucao_aluno()
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

  return coalesce((
      select jsonb_agg(registro order by (registro ->> 'data'))
      from (
        select jsonb_build_object(
          'data', avaliacao.data_avaliacao,
          'nota', round(case when avg(avaliacao_criterio.nota) <= 10 then avg(avaliacao_criterio.nota) * 10 else avg(avaliacao_criterio.nota) end)
        ) as registro
        from public.avaliacao as avaliacao
        left join public.avaliacao_criterio as avaliacao_criterio on avaliacao_criterio.id_avaliacao = avaliacao.id_avaliacao
        where avaliacao.id_aluno = aluno_atual.id_aluno
        group by avaliacao.id_avaliacao, avaliacao.data_avaliacao
        order by avaliacao.data_avaliacao
        limit 12
      ) as historico
    ), '[]'::jsonb);
end;
$$;

grant execute on function public.historico_evolucao_aluno() to authenticated;
