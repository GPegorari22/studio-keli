-- Mantém as categorias da loja iguais às categorias exibidas no Figma.
do $$
declare
  categoria_materiais integer;
  categoria_outros integer;
begin
  select id_categoria into categoria_materiais
  from public.categoria_produto
  where lower(trim(nome)) = 'materiais'
  limit 1;

  select id_categoria into categoria_outros
  from public.categoria_produto
  where lower(trim(nome)) = 'outros'
  limit 1;

  if categoria_materiais is not null and categoria_outros is null then
    update public.categoria_produto
    set nome = 'Outros', descricao = 'Outros produtos do Studio.'
    where id_categoria = categoria_materiais;
  elsif categoria_materiais is not null and categoria_outros is not null then
    update public.produto
    set id_categoria = categoria_outros
    where id_categoria = categoria_materiais;
    delete from public.categoria_produto where id_categoria = categoria_materiais;
  end if;

  insert into public.categoria_produto (nome, descricao)
  select 'Calçados', 'Sapatilhas e calçados para dança.'
  where not exists (
    select 1 from public.categoria_produto where lower(trim(nome)) = 'calçados'
  );
end;
$$;
