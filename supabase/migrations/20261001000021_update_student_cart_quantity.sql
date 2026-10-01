-- Atualiza a quantidade de um item do carrinho do aluno autenticado.
create or replace function public.atualizar_quantidade_item_carrinho(
  p_id_item bigint,
  p_quantidade integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantidade < 1 then
    delete from public.item_carrinho_aluno item
    where item.id_item = p_id_item
      and exists (
        select 1
        from public.carrinho_aluno carrinho
        where carrinho.id_carrinho = item.id_carrinho
          and carrinho.id_usuario = auth.uid()
      );
  else
    update public.item_carrinho_aluno item
    set quantidade = p_quantidade,
        atualizado_em = now()
    where item.id_item = p_id_item
      and exists (
        select 1
        from public.carrinho_aluno carrinho
        where carrinho.id_carrinho = item.id_carrinho
          and carrinho.id_usuario = auth.uid()
      );
  end if;

  return found;
end;
$$;

grant execute on function public.atualizar_quantidade_item_carrinho(bigint, integer) to authenticated;
