-- Dashboard administrativo: somente dados reais, sem alterações nas tabelas existentes.
-- As funções administrativas usam is_admin() e evitam as policies recursivas antigas.
-- Há dois fluxos de pedido no projeto; a chave inclui a origem para não duplicar IDs.
create or replace function public._admin_pedidos()
returns table(chave text, origem text, id_pedido bigint, id_usuario uuid, data_pedido timestamptz, status text, valor_total numeric)
language sql stable security definer set search_path = ''
as $$
  select 'pedido:' || p.id_pedido, 'pedido', p.id_pedido::bigint, p.id_usuario,
         p.data_pedido::timestamptz, p.status::text, p.valor_total::numeric
  from public.pedido p
  union all
  select 'pedidos:' || p.id_pedido, 'pedidos', p.id_pedido, p.id_usuario,
         p.criado_em, p.status, p.total
  from public.pedidos p;
$$;
revoke all on function public._admin_pedidos() from public, anon, authenticated;

create or replace function public._admin_mensalidades()
returns table(id_mensalidade integer, id_aluno integer, competencia date, vencimento date, status text, valor numeric, saldo numeric)
language sql stable security definer set search_path = ''
as $$
  select m.id_mensalidade, m.id_aluno, m.competencia::date, m.vencimento::date,
         m.status::text, m.valor::numeric,
         greatest(m.valor - coalesce((select sum(p.valor) from public.pagamento p where p.id_mensalidade = m.id_mensalidade), 0), 0)::numeric
  from public.mensalidade m
  where lower(trim(m.status)) not in ('pago', 'paga', 'quitado', 'quitada', 'cancelado', 'cancelada', 'isento', 'isenta');
$$;
revoke all on function public._admin_mensalidades() from public, anon, authenticated;

-- Não existe marcador de chamada concluída nem histórico de fim da matrícula.
-- Regra conservadora: aula realizada e encerrada, com chamada explícita (true/false)
-- para TODOS os matriculados ativos cuja matrícula já existia na data da aula.
-- Registros ausentes nunca são transformados em faltas; chamadas parciais são omitidas.
create or replace function public._admin_frequencias(p_inicio date, p_fim date, p_turma integer default null)
returns table(id_aula integer, id_aluno integer, id_turma integer, data_aula date, presente boolean)
language sql stable security definer set search_path = ''
as $$
  with aulas_completas as (
    select a.id_aula, a.id_turma, a.data_aula
    from public.aula a
    where a.data_aula between p_inicio and p_fim
      and (p_turma is null or a.id_turma = p_turma)
      and lower(trim(a.status)) in ('realizada', 'realizado', 'concluida', 'concluída', 'finalizada')
      and a.data_aula + coalesce(a.horario_fim, a.horario_inicio) <= timezone('America/Sao_Paulo', now())
      and exists (
        select 1 from public.matricula m
        where m.id_turma = a.id_turma and m.data_matricula::date <= a.data_aula
          and lower(trim(m.status)) in ('ativo', 'ativa')
      )
      and not exists (
        select 1 from public.matricula m
        where m.id_turma = a.id_turma and m.data_matricula::date <= a.data_aula
          and lower(trim(m.status)) in ('ativo', 'ativa')
          and not exists (
            select 1 from public.frequencia f
            where f.id_aula = a.id_aula and f.id_aluno = m.id_aluno and f.presente is not null
          )
      )
  )
  select distinct on (f.id_aula, f.id_aluno) f.id_aula, f.id_aluno, a.id_turma, a.data_aula, f.presente
  from aulas_completas a join public.frequencia f on f.id_aula = a.id_aula
  where f.presente is not null
  order by f.id_aula, f.id_aluno, f.data_registro desc, f.id_frequencia desc;
$$;
revoke all on function public._admin_frequencias(date, date, integer) from public, anon, authenticated;

create or replace function public.painel_admin_dados(
  p_inicio date default null, p_fim date default null,
  p_turma integer default null, p_agenda date default null
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  hoje date := timezone('America/Sao_Paulo', now())::date;
  inicio date := coalesce(p_inicio, date_trunc('month', timezone('America/Sao_Paulo', now()))::date);
  fim date := least(coalesce(p_fim, hoje), hoje);
  dia_agenda date := coalesce(p_agenda, hoje);
  resposta jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if inicio > fim or fim - inicio > 1096 then
    raise exception 'Escolha um período válido de até três anos.' using errcode = '22023';
  end if;
  with presencas as materialized (
    select * from public._admin_frequencias(inicio, fim, p_turma)
  ), baixa_frequencia as (
    select id_aluno, round(100.0 * count(*) filter (where presente) / count(*), 1) percentual
    from presencas group by id_aluno
    having 100.0 * count(*) filter (where presente) / count(*) < 70
  ), vencidas as (
    select * from public._admin_mensalidades() where vencimento < hoje and saldo > 0
  ), pedidos as materialized (
    select * from public._admin_pedidos()
  ), retiradas as (
    select * from pedidos
    where lower(trim(status)) in ('pronto', 'pronto para retirada', 'pronto_para_retirada', 'aguardando retirada', 'aguardando_retirada', 'disponível para retirada', 'disponivel para retirada')
  ), meses as (
    select generate_series(date_trunc('month', inicio::timestamp), date_trunc('month', fim::timestamp), interval '1 month')::date mes
  ), frequencia_mensal as (
    select m.mes, count(f.id_aula) registros,
           round(100.0 * count(f.id_aula) filter (where f.presente) / nullif(count(f.id_aula), 0), 1) percentual
    from meses m left join presencas f on date_trunc('month', f.data_aula::timestamp)::date = m.mes
    group by m.mes
  ), recentes as (
    select a.id_aluno, a.nome, a.email, a.status, a.foto_perfil,
           ma.data_matricula, ma.turma, ma.modalidade,
           (exists(select 1 from vencidas v where v.id_aluno = a.id_aluno)) pendencia_financeira,
           (exists(select 1 from baixa_frequencia b where b.id_aluno = a.id_aluno)) baixa_frequencia
    from public.aluno a
    join lateral (
      select m.data_matricula, t.nome turma, mo.nome modalidade
      from public.matricula m
      join public.turma t on t.id_turma = m.id_turma
      left join public.modalidade mo on mo.id_modalidade = t.id_modalidade
      where m.id_aluno = a.id_aluno
      order by m.data_matricula desc, m.id_matricula desc limit 1
    ) ma on true
    order by ma.data_matricula desc, a.id_aluno desc limit 5
  )
  select jsonb_build_object(
    'usuario', (select jsonb_build_object('id', u.id_usuario, 'nome', u.nome, 'email', u.email, 'telefone', u.telefone, 'perfil', p.nome)
                from public.usuario u left join public.perfil p on p.id_perfil = u.id_perfil where u.id_usuario = auth.uid()),
    'hoje', hoje, 'inicio', inicio, 'fim', fim, 'data_agenda', dia_agenda,
    'indicadores', jsonb_build_object(
      'alunos_ativos', (select count(*) from public.aluno where lower(trim(status)) in ('ativo', 'ativa')),
      'professores', (select count(*) from public.professor where lower(trim(status)) in ('ativo', 'ativa')),
      'turmas_ativas', (select count(*) from public.turma where lower(trim(status)) in ('ativo', 'ativa')),
      'frequencia_media', (select round(100.0 * count(*) filter (where presente) / nullif(count(*), 0), 1) from presencas),
      'pedidos_loja', (select count(*) from pedidos where timezone('America/Sao_Paulo', data_pedido)::date between inicio and fim),
      'registros_frequencia', (select count(*) from presencas)
    ),
    'turmas', coalesce((select jsonb_agg(jsonb_build_object('id', t.id_turma, 'nome', t.nome) order by t.nome) from public.turma t), '[]'::jsonb),
    'agenda', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id_aula', a.id_aula, 'data', a.data_aula, 'horario_inicio', a.horario_inicio,
        'horario_fim', a.horario_fim, 'status', a.status, 'turma', t.nome,
        'modalidade', m.nome, 'professora', p.nome
      ) order by a.horario_inicio, a.id_aula)
      from public.aula a join public.turma t on t.id_turma = a.id_turma
      left join public.modalidade m on m.id_modalidade = t.id_modalidade
      left join public.professor p on p.id_professor = t.id_professor
      where a.data_aula = dia_agenda
    ), '[]'::jsonb),
    'frequencia', coalesce((select jsonb_agg(to_jsonb(f) order by f.mes) from frequencia_mensal f), '[]'::jsonb),
    'pendencias', jsonb_build_object(
      'financeiro', (select count(*) from vencidas),
      'frequencia', (select count(*) from baixa_frequencia),
      'matriculas', (select count(*) from public.matricula where lower(trim(status)) in ('pendente', 'aguardando confirmação', 'aguardando confirmacao', 'aguardando_confirmacao')),
      'loja', (select count(*) from retiradas)
    ),
    'alunos_recentes', coalesce((select jsonb_agg(to_jsonb(r) order by r.data_matricula desc, r.id_aluno desc) from recentes r), '[]'::jsonb),
    'notificacoes_nao_lidas', (select count(*) from public.comunicado_usuario cu where cu.id_usuario = auth.uid() and not cu.lido)
  ) into resposta;
  return resposta;
end;
$$;
revoke all on function public.painel_admin_dados(date, date, integer, date) from public, anon;
grant execute on function public.painel_admin_dados(date, date, integer, date) to authenticated;

-- Listagens dos botões e da busca, com filtro no servidor e paginação.
create or replace function public.admin_listagem(
  p_modulo text, p_busca text default '', p_filtro text default '',
  p_inicio date default null, p_fim date default null, p_turma integer default null,
  p_pagina integer default 0
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  hoje date := timezone('America/Sao_Paulo', now())::date;
  inicio date := coalesce(p_inicio, date_trunc('month', timezone('America/Sao_Paulo', now()))::date);
  fim date := coalesce(p_fim, hoje);
  resposta jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if p_pagina < 0 or p_pagina > 10000 or inicio > fim or fim - inicio > 1096 then
    raise exception 'Filtros inválidos.' using errcode = '22023';
  end if;
  with frequencias as materialized (
    select id_aluno, count(*) aulas, count(*) filter(where presente) presencas,
           round(100.0 * count(*) filter(where presente) / count(*), 1) percentual
    from public._admin_frequencias(inicio, least(fim, hoje), p_turma) group by id_aluno
  ), vencidas as materialized (
    select * from public._admin_mensalidades() where vencimento < hoje and saldo > 0
  ), registros as (
    select a.id_aluno::text chave, jsonb_build_object(
      '_modulo', 'alunos', 'id', a.id_aluno, 'nome', a.nome, 'email', a.email, 'telefone', a.telefone,
      'foto', a.foto_perfil, 'status', a.status,
      'turma', ma.turma, 'modalidade', ma.modalidade, 'data', ma.data_matricula,
      'frequencia', f.percentual, 'aulas', f.aulas, 'presencas', f.presencas,
      'pendencia_financeira', exists(select 1 from vencidas v where v.id_aluno = a.id_aluno),
      'baixa_frequencia', coalesce(f.percentual < 70, false)
    ) registro, coalesce(ma.data_matricula::text, '') ordenacao
    from public.aluno a
    left join frequencias f on f.id_aluno = a.id_aluno
    left join lateral (
      select m.data_matricula, t.nome turma, mo.nome modalidade
      from public.matricula m join public.turma t on t.id_turma = m.id_turma
      left join public.modalidade mo on mo.id_modalidade = t.id_modalidade
      where m.id_aluno = a.id_aluno and (p_turma is null or m.id_turma = p_turma)
      order by m.data_matricula desc, m.id_matricula desc limit 1
    ) ma on true
    where p_modulo in ('alunos', 'frequencia', 'busca')
      and (p_turma is null or ma.turma is not null)
      and (p_modulo <> 'frequencia' or f.id_aluno is not null)
      and (p_filtro <> 'baixa' or f.percentual < 70)
      and (p_filtro <> 'ativos' or lower(trim(a.status)) in ('ativo', 'ativa'))
    union all
    select p.id_professor::text, jsonb_build_object('_modulo', 'professores', 'id', p.id_professor, 'nome', p.nome, 'email', p.email, 'telefone', p.telefone, 'especialidade', p.especialidade, 'status', p.status), p.nome
    from public.professor p where p_modulo in ('professores', 'busca')
      and (p_filtro <> 'ativos' or lower(trim(p.status)) in ('ativo', 'ativa'))
    union all
    select t.id_turma::text, jsonb_build_object('_modulo', 'turmas', 'id', t.id_turma, 'nome', t.nome, 'modalidade', m.nome, 'professora', p.nome, 'dia', t.dia_semana, 'horario', t.horario, 'capacidade', t.capacidade, 'status', t.status), t.nome
    from public.turma t left join public.modalidade m on m.id_modalidade = t.id_modalidade
    left join public.professor p on p.id_professor = t.id_professor
    where p_modulo in ('turmas', 'busca') and (p_turma is null or t.id_turma = p_turma)
      and (p_filtro <> 'ativas' or lower(trim(t.status)) in ('ativo', 'ativa'))
    union all
    select a.id_aula::text, jsonb_build_object('_modulo', 'agenda', 'id', a.id_aula, 'data', a.data_aula, 'inicio', a.horario_inicio, 'fim', a.horario_fim, 'nome', t.nome, 'modalidade', m.nome, 'professora', p.nome, 'status', a.status), a.data_aula::text || ' ' || a.horario_inicio::text
    from public.aula a join public.turma t on t.id_turma = a.id_turma
    left join public.modalidade m on m.id_modalidade = t.id_modalidade
    left join public.professor p on p.id_professor = t.id_professor
    where p_modulo in ('agenda', 'busca') and a.data_aula between inicio and fim
      and (p_turma is null or a.id_turma = p_turma)
    union all
    select v.id_mensalidade::text, jsonb_build_object('_modulo', 'financeiro', 'id', v.id_mensalidade, 'nome', a.nome, 'competencia', v.competencia, 'data', v.vencimento, 'valor', v.valor, 'saldo', v.saldo, 'status', v.status), v.vencimento::text
    from public._admin_mensalidades() v join public.aluno a on a.id_aluno = v.id_aluno
    where p_modulo in ('financeiro', 'busca') and v.saldo > 0
      and (p_filtro <> 'vencidas' or v.vencimento < hoje)
    union all
    select m.id_matricula::text, jsonb_build_object('_modulo', 'matriculas', 'id', m.id_matricula, 'nome', a.nome, 'turma', t.nome, 'data', m.data_matricula, 'status', m.status), m.data_matricula::text
    from public.matricula m join public.aluno a on a.id_aluno = m.id_aluno
    join public.turma t on t.id_turma = m.id_turma
    where p_modulo in ('matriculas', 'busca') and (p_turma is null or t.id_turma = p_turma)
      and (p_filtro <> 'pendentes' or lower(trim(m.status)) in ('pendente', 'aguardando confirmação', 'aguardando confirmacao', 'aguardando_confirmacao'))
    union all
    select p.chave, jsonb_build_object('_modulo', 'pedidos', 'id', p.id_pedido, 'chave', p.chave, 'origem', p.origem, 'nome', u.nome, 'email', u.email, 'data', p.data_pedido, 'valor', p.valor_total, 'status', p.status), p.data_pedido::text
    from public._admin_pedidos() p left join public.usuario u on u.id_usuario = p.id_usuario
    where p_modulo in ('pedidos', 'busca')
      and (p_filtro = 'retirada' or timezone('America/Sao_Paulo', p.data_pedido)::date between inicio and fim)
      and (p_filtro <> 'retirada' or lower(trim(p.status)) in ('pronto', 'pronto para retirada', 'pronto_para_retirada', 'aguardando retirada', 'aguardando_retirada', 'disponível para retirada', 'disponivel para retirada'))
    union all
    select p.id_produto::text, jsonb_build_object('_modulo', 'produtos', 'id', p.id_produto, 'nome', p.nome, 'categoria', c.nome, 'valor', p.preco, 'estoque', p.estoque, 'status', p.status), p.nome
    from public.produto p left join public.categoria_produto c on c.id_categoria = p.id_categoria
    where p_modulo in ('produtos', 'busca')
    union all
    select c.id_comunicado::text, jsonb_build_object('_modulo', 'notificacoes', 'id', c.id_comunicado, 'nome', c.titulo, 'conteudo', c.conteudo, 'data', c.data_envio, 'lido', cu.lido), c.data_envio::text
    from public.comunicado_usuario cu join public.comunicado c on c.id_comunicado = cu.id_comunicado
    where p_modulo in ('notificacoes', 'busca') and cu.id_usuario = auth.uid()
      and (p_filtro <> 'nao_lidas' or not cu.lido)
  ), filtrados as (
    select * from registros
    where nullif(trim(p_busca), '') is null
      or (registro - 'foto')::text ilike '%' || replace(replace(replace(p_busca, '\', '\\'), '%', '\%'), '_', '\_') || '%'
  ), pagina as (
    select * from filtrados
    order by
      case when p_modulo in ('alunos', 'matriculas', 'pedidos', 'notificacoes') then ordenacao end desc,
      case when p_modulo not in ('alunos', 'matriculas', 'pedidos', 'notificacoes') then ordenacao end asc,
      chave
    limit 25 offset p_pagina * 25
  )
  select jsonb_build_object(
    'total', (select count(*) from filtrados),
    'pagina', p_pagina,
    'registros', coalesce((select jsonb_agg(registro) from pagina), '[]'::jsonb)
  ) into resposta;
  return resposta;
end;
$$;
revoke all on function public.admin_listagem(text, text, text, date, date, integer, integer) from public, anon;
grant execute on function public.admin_listagem(text, text, text, date, date, integer, integer) to authenticated;

create or replace function public.admin_ler_comunicado(p_comunicado integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  update public.comunicado_usuario set lido = true, data_leitura = now()
  where id_comunicado = p_comunicado and id_usuario = auth.uid();
  if not found then raise exception 'Comunicado não encontrado.'; end if;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_ler_comunicado(integer) from public, anon;
grant execute on function public.admin_ler_comunicado(integer) to authenticated;

-- Mantém consumidores antigos funcionando e corrige o aggregate aninhado.
create or replace function public.painel_administrativo()
returns jsonb language sql stable security definer set search_path = ''
as $$ select public.painel_admin_dados(); $$;
revoke all on function public.painel_administrativo() from public, anon;
grant execute on function public.painel_administrativo() to authenticated;
notify pgrst, 'reload schema';
