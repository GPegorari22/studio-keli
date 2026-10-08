-- Retorna os dados reais usados na tela financeira administrativa.
create or replace function public.admin_resumo_financeiro()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inicio_mes date := date_trunc('month', current_date - interval '5 months')::date;
  mes_atual date := date_trunc('month', current_date)::date;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'evolucao', coalesce((
      with meses as (
        select generate_series(inicio_mes, mes_atual, interval '1 month')::date as mes
      )
      select jsonb_agg(jsonb_build_object(
        'mes', m.mes,
        'recebido', coalesce((select sum(p.valor) from public.pagamento p where date_trunc('month', p.data_pagamento)::date = m.mes), 0),
        'previsto', coalesce((select sum(mm.valor) from public.mensalidade mm where date_trunc('month', mm.vencimento)::date = m.mes), 0)
      ) order by m.mes)
      from meses m
    ), '[]'::jsonb),
    'receita_mes', coalesce((
      select sum(m.valor) from public.mensalidade m where date_trunc('month', m.vencimento)::date = mes_atual
    ), 0),
    'recebido_mes', coalesce((
      select sum(p.valor) from public.pagamento p where date_trunc('month', p.data_pagamento)::date = mes_atual
    ), 0),
    'aberto', coalesce((
      select sum(greatest(m.valor - coalesce((select sum(p.valor) from public.pagamento p where p.id_mensalidade = m.id_mensalidade), 0), 0))
      from public.mensalidade m
      where lower(trim(m.status)) not in ('pago', 'paga', 'quitado', 'quitada', 'cancelado', 'cancelada', 'isento', 'isenta')
    ), 0),
    'atrasado', coalesce((
      select sum(greatest(m.valor - coalesce((select sum(p.valor) from public.pagamento p where p.id_mensalidade = m.id_mensalidade), 0), 0))
      from public.mensalidade m
      where m.vencimento < current_date
        and greatest(m.valor - coalesce((select sum(p.valor) from public.pagamento p where p.id_mensalidade = m.id_mensalidade), 0), 0) > 0
    ), 0),
    'crescimento', coalesce((
      with valores as (
        select
          coalesce((select sum(p.valor) from public.pagamento p where date_trunc('month', p.data_pagamento)::date = inicio_mes), 0)::numeric as primeiro,
          coalesce((select sum(p.valor) from public.pagamento p where date_trunc('month', p.data_pagamento)::date = mes_atual), 0)::numeric as ultimo
      )
      select case when primeiro = 0 then 0 else round(((ultimo - primeiro) / primeiro) * 100, 1) end from valores
    ), 0),
    'status', jsonb_build_object(
      'a_vencer', (select count(*) from public.mensalidade m where m.vencimento >= current_date and greatest(m.valor - coalesce((select sum(p.valor) from public.pagamento p where p.id_mensalidade = m.id_mensalidade), 0), 0) > 0),
      'em_aberto', (select count(*) from public.mensalidade m where greatest(m.valor - coalesce((select sum(p.valor) from public.pagamento p where p.id_mensalidade = m.id_mensalidade), 0), 0) > 0),
      'atrasado', (select count(*) from public.mensalidade m where m.vencimento < current_date and greatest(m.valor - coalesce((select sum(p.valor) from public.pagamento p where p.id_mensalidade = m.id_mensalidade), 0), 0) > 0),
      'pago', (select count(*) from public.mensalidade m where lower(trim(m.status)) in ('pago', 'paga', 'quitado', 'quitada'))
    )
  );
end;
$$;

revoke all on function public.admin_resumo_financeiro() from public;
grant execute on function public.admin_resumo_financeiro() to authenticated;
