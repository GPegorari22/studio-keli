-- Dados e atualização do quadro financeiro administrativo.
create or replace function public.admin_mensalidades_kanban()
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
      'id', m.id_mensalidade,
      'id_mensalidade', m.id_mensalidade,
      'id_aluno', m.id_aluno,
      'nome', a.nome,
      'competencia', m.competencia,
      'data', m.vencimento,
      'vencimento', m.vencimento,
      'valor', m.valor,
      'saldo', greatest(m.valor - coalesce((select sum(pg.valor) from public.pagamento pg where pg.id_mensalidade = m.id_mensalidade), 0), 0),
      'status', m.status
    ) order by m.vencimento, m.id_mensalidade)
    from public.mensalidade m
    join public.aluno a on a.id_aluno = m.id_aluno
    where lower(trim(coalesce(m.status, ''))) not in ('cancelado', 'cancelada', 'isento', 'isenta')
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_mensalidades_kanban() from public;
grant execute on function public.admin_mensalidades_kanban() to authenticated;

create or replace function public.admin_atualizar_status_mensalidade(
  p_id_mensalidade integer,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  status_normalizado text := lower(trim(coalesce(p_status, '')));
  mensalidade_atual public.mensalidade%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  if status_normalizado not in ('a vencer', 'em aberto', 'atrasado', 'pago') then
    raise exception 'Status financeiro inválido.' using errcode = '22023';
  end if;

  update public.mensalidade
  set status = case status_normalizado
    when 'a vencer' then 'A Vencer'
    when 'em aberto' then 'Em Aberto'
    when 'atrasado' then 'Atrasado'
    when 'pago' then 'Pago'
  end
  where id_mensalidade = p_id_mensalidade
  returning * into mensalidade_atual;

  if mensalidade_atual.id_mensalidade is null then
    raise exception 'Mensalidade não encontrada.' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', mensalidade_atual.id_mensalidade,
    'status', mensalidade_atual.status
  );
end;
$$;

revoke all on function public.admin_atualizar_status_mensalidade(integer, text) from public;
grant execute on function public.admin_atualizar_status_mensalidade(integer, text) to authenticated;
