-- Retorna os pedidos reais de um aluno para a aba Compras do perfil administrativo.
create or replace function public.compras_aluno_admin(p_id_aluno integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  select a.id_usuario into usuario_id
  from public.aluno a
  where a.id_aluno = p_id_aluno;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id_pedido', p.id_pedido,
      'criado_em', p.criado_em,
      'forma_pagamento', p.forma_pagamento,
      'status', p.status,
      'total', p.total,
      'itens_pedido', coalesce((
        select jsonb_agg(jsonb_build_object(
          'quantidade', i.quantidade,
          'tamanho', i.tamanho,
          'preco_unitario', i.preco_unitario,
          'produto', jsonb_build_object('nome', pr.nome)
        ) order by i.id_item_pedido)
        from public.itens_pedido i
        join public.produto pr on pr.id_produto = i.id_produto
        where i.id_pedido = p.id_pedido
      ), '[]'::jsonb)
    ) order by p.criado_em desc)
    from public.pedidos p
    where p.id_usuario = usuario_id
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.compras_aluno_admin(integer) from public;
grant execute on function public.compras_aluno_admin(integer) to authenticated;
