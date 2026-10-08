-- Permite ao administrador dar baixa em um pedido da loja.
create or replace function public.dar_baixa_pedido_admin(p_id_pedido bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_atual public.pedidos%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  update public.pedidos
  set status = 'concluido'
  where id_pedido = p_id_pedido
  returning * into pedido_atual;

  if pedido_atual.id_pedido is null then
    raise exception 'Pedido não encontrado.';
  end if;

  return jsonb_build_object(
    'id_pedido', pedido_atual.id_pedido,
    'status', pedido_atual.status
  );
end;
$$;

revoke all on function public.dar_baixa_pedido_admin(bigint) from public;
grant execute on function public.dar_baixa_pedido_admin(bigint) to authenticated;
