-- Dados fictícios para validar o catálogo da loja no painel do aluno.
-- A migration é idempotente: pode ser executada novamente sem duplicar categorias ou produtos.
do $$
declare
  categoria_vestuario integer;
  categoria_acessorios integer;
  categoria_material integer;
begin
  insert into public.categoria_produto (nome, descricao)
  select 'Vestuário', 'Roupas e peças para os treinos do Studio.'
  where not exists (select 1 from public.categoria_produto where lower(trim(nome)) = lower('Vestuário'));

  insert into public.categoria_produto (nome, descricao)
  select 'Acessórios', 'Acessórios para acompanhar sua rotina de dança.'
  where not exists (select 1 from public.categoria_produto where lower(trim(nome)) = lower('Acessórios'));

  insert into public.categoria_produto (nome, descricao)
  select 'Materiais', 'Materiais de apoio para aulas e ensaios.'
  where not exists (select 1 from public.categoria_produto where lower(trim(nome)) = lower('Materiais'));

  select id_categoria into categoria_vestuario
  from public.categoria_produto
  where lower(trim(nome)) = lower('Vestuário')
  order by id_categoria
  limit 1;

  select id_categoria into categoria_acessorios
  from public.categoria_produto
  where lower(trim(nome)) = lower('Acessórios')
  order by id_categoria
  limit 1;

  select id_categoria into categoria_material
  from public.categoria_produto
  where lower(trim(nome)) = lower('Materiais')
  order by id_categoria
  limit 1;

  insert into public.produto (nome, descricao, preco, estoque, estoque_minimo, sku, id_categoria)
  select 'Collant Studio Rosa', 'Collant confortável para aulas de ballet e ensaios.', 129.90, 18, 3, 'TEST-COLLANT-ROSA', categoria_vestuario
  where not exists (select 1 from public.produto where sku = 'TEST-COLLANT-ROSA');

  insert into public.produto (nome, descricao, preco, estoque, estoque_minimo, sku, id_categoria)
  select 'Saia de Ensaio Keli', 'Saia leve para acompanhar seus movimentos.', 89.90, 12, 2, 'TEST-SAIA-ENSAIO', categoria_vestuario
  where not exists (select 1 from public.produto where sku = 'TEST-SAIA-ENSAIO');

  insert into public.produto (nome, descricao, preco, estoque, estoque_minimo, sku, id_categoria)
  select 'Meia Calça Ballet', 'Meia calça de dança para aulas e apresentações.', 54.90, 25, 5, 'TEST-MEIA-BALLET', categoria_vestuario
  where not exists (select 1 from public.produto where sku = 'TEST-MEIA-BALLET');

  insert into public.produto (nome, descricao, preco, estoque, estoque_minimo, sku, id_categoria)
  select 'Squeeze Studio Keli', 'Garrafa reutilizável para hidratação durante as aulas.', 39.90, 20, 4, 'TEST-SQUEEZE-KELI', categoria_acessorios
  where not exists (select 1 from public.produto where sku = 'TEST-SQUEEZE-KELI');

  insert into public.produto (nome, descricao, preco, estoque, estoque_minimo, sku, id_categoria)
  select 'Bolsa de Dança', 'Bolsa prática para sapatilhas e acessórios.', 149.90, 8, 2, 'TEST-BOLSA-DANCA', categoria_acessorios
  where not exists (select 1 from public.produto where sku = 'TEST-BOLSA-DANCA');

  insert into public.produto (nome, descricao, preco, estoque, estoque_minimo, sku, id_categoria)
  select 'Caderno de Ensaios', 'Caderno para anotar metas, aulas e coreografias.', 29.90, 30, 5, 'TEST-CADERNO-ENSAIOS', categoria_material
  where not exists (select 1 from public.produto where sku = 'TEST-CADERNO-ENSAIOS');
end;
$$;
