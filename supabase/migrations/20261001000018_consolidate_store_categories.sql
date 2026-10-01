-- Consolida duplicatas e deixa somente as quatro categorias da loja.
do $$
declare
  categoria_outros integer;
  categoria record;
  categoria_canonica integer;
begin
  insert into public.categoria_produto (nome, descricao)
  select nome, descricao
  from (values
    ('Acessórios', 'Acessórios para acompanhar sua rotina de dança.'),
    ('Calçados', 'Sapatilhas e calçados para dança.'),
    ('Outros', 'Outros produtos do Studio.'),
    ('Vestuário', 'Roupas e peças para os treinos do Studio.')
  ) as categorias(nome, descricao)
  where not exists (
    select 1 from public.categoria_produto existente
    where lower(trim(existente.nome)) = lower(trim(categorias.nome))
  );

  select id_categoria into categoria_outros
  from public.categoria_produto
  where lower(trim(nome)) = 'outros'
  order by id_categoria
  limit 1;

  for categoria in
    select id_categoria, lower(trim(nome)) as nome
    from public.categoria_produto
  loop
    if categoria.nome not in ('acessórios', 'acessorios', 'calçados', 'calcados', 'outros', 'vestuário', 'vestuario') then
      update public.produto
      set id_categoria = categoria_outros
      where id_categoria = categoria.id_categoria;
      delete from public.categoria_produto where id_categoria = categoria.id_categoria;
    end if;
  end loop;

  for categoria in
    select id_categoria, lower(trim(nome)) as nome
    from public.categoria_produto
    where lower(trim(nome)) in ('acessórios', 'acessorios', 'calçados', 'calcados', 'outros', 'vestuário', 'vestuario')
  loop
    select min(id_categoria) into categoria_canonica
    from public.categoria_produto
    where lower(trim(nome)) = categoria.nome;

    if categoria.id_categoria <> categoria_canonica then
      update public.produto
      set id_categoria = categoria_canonica
      where id_categoria = categoria.id_categoria;
      delete from public.categoria_produto where id_categoria = categoria.id_categoria;
    end if;
  end loop;
end;
$$;
