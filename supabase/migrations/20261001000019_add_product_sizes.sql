-- Tamanhos disponíveis por produto, usados pelo modal da loja.
alter table public.produto
  add column if not exists tamanhos_disponiveis text[] not null default array['Único']::text[];

update public.produto
set tamanhos_disponiveis = array['24', '25', '26', '27', '28', '29', '30']::text[]
where lower(trim(nome)) in ('sapatilha de ponta', 'meia calça ballet')
   or sku in ('TEST-MEIA-BALLET');

update public.produto
set tamanhos_disponiveis = array['PP', 'P', 'M', 'G', 'GG']::text[]
where sku in ('TEST-COLLANT-ROSA', 'TEST-SAIA-ENSAIO');

update public.produto
set tamanhos_disponiveis = array['Único']::text[]
where sku in ('TEST-SQUEEZE-KELI', 'TEST-BOLSA-DANCA', 'TEST-CADERNO-ENSAIOS');
