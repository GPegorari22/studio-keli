-- Retorna evolução e financeiro de um aluno para o perfil administrativo.
create or replace function public.detalhes_aluno_admin(p_id_aluno integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'evolucao', coalesce((
      select jsonb_agg(registro order by (registro ->> 'data'))
      from (
        select jsonb_build_object(
          'data', a.data_avaliacao,
          'nota', round(case when avg(ac.nota) <= 10 then avg(ac.nota) * 10 else avg(ac.nota) end)
        ) as registro
        from public.avaliacao a
        left join public.avaliacao_criterio ac on ac.id_avaliacao = a.id_avaliacao
        where a.id_aluno = p_id_aluno
        group by a.id_avaliacao, a.data_avaliacao
      ) historico
    ), '[]'::jsonb),
    'financeiro', jsonb_build_object(
      'proximo_vencimento', (
        select jsonb_build_object('competencia', m.competencia, 'vencimento', m.vencimento, 'valor', m.valor, 'status', m.status)
        from public.mensalidade m
        where m.id_aluno = p_id_aluno and lower(trim(m.status)) not in ('pago', 'quitado', 'quitada')
        order by m.vencimento limit 1
      ),
      'total_pago_ano', coalesce((
        select sum(pg.valor)
        from public.pagamento pg
        join public.mensalidade m on m.id_mensalidade = pg.id_mensalidade
        where m.id_aluno = p_id_aluno and extract(year from pg.data_pagamento) = extract(year from current_date)
      ), 0),
      'mensalidades', coalesce((
        select jsonb_agg(jsonb_build_object('competencia', m.competencia, 'vencimento', m.vencimento, 'valor', m.valor, 'status', m.status) order by m.vencimento desc)
        from public.mensalidade m where m.id_aluno = p_id_aluno
      ), '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.detalhes_aluno_admin(integer) from public;
grant execute on function public.detalhes_aluno_admin(integer) to authenticated;
