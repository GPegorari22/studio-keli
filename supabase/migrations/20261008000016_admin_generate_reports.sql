-- Gera dados dos relatórios administrativos usando os filtros selecionados.
create or replace function public.admin_gerar_relatorio(
  p_tipo text,
  p_inicio date,
  p_fim date,
  p_modalidade text default null,
  p_turma text default null,
  p_professor text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tipo_normalizado text := lower(trim(coalesce(p_tipo, '')));
  registros jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if p_inicio is null or p_fim is null or p_inicio > p_fim then
    raise exception 'Informe um período válido.' using errcode = '22023';
  end if;

  if tipo_normalizado = 'financeiro' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'aluno', a.nome, 'competencia', m.competencia, 'vencimento', m.vencimento,
      'valor', m.valor, 'saldo', greatest(m.valor - coalesce((select sum(pg.valor) from public.pagamento pg where pg.id_mensalidade = m.id_mensalidade), 0), 0),
      'status', m.status, 'turma', t.nome, 'modalidade', mo.nome, 'professor', pr.nome
    ) order by m.vencimento), '[]'::jsonb) into registros
    from public.mensalidade m
    join public.aluno a on a.id_aluno = m.id_aluno
    left join public.matricula ma on ma.id_aluno = a.id_aluno
    left join public.turma t on t.id_turma = ma.id_turma
    left join public.modalidade mo on mo.id_modalidade = t.id_modalidade
    left join public.professor pr on pr.id_professor = t.id_professor
    where m.vencimento between p_inicio and p_fim
      and (nullif(trim(p_modalidade), '') is null or mo.nome = p_modalidade)
      and (nullif(trim(p_turma), '') is null or t.nome = p_turma)
      and (nullif(trim(p_professor), '') is null or pr.nome = p_professor);
  elsif tipo_normalizado = 'frequencia' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'aluno', resumo.aluno, 'turma', resumo.turma, 'aulas', resumo.aulas,
      'presencas', resumo.presencas, 'frequencia', resumo.frequencia
    ) order by resumo.aluno), '[]'::jsonb) into registros
    from (
      select a.nome aluno, t.nome turma, count(f.id_frequencia) aulas,
             count(f.id_frequencia) filter (where f.presente) presencas,
             round(100.0 * count(f.id_frequencia) filter (where f.presente) / nullif(count(f.id_frequencia), 0), 1) frequencia
      from public.frequencia f
      join public.aluno a on a.id_aluno = f.id_aluno
      join public.aula au on au.id_aula = f.id_aula
      join public.turma t on t.id_turma = au.id_turma
      left join public.modalidade mo on mo.id_modalidade = t.id_modalidade
      left join public.professor pr on pr.id_professor = t.id_professor
      where au.data_aula between p_inicio and p_fim
        and (nullif(trim(p_modalidade), '') is null or mo.nome = p_modalidade)
        and (nullif(trim(p_turma), '') is null or t.nome = p_turma)
        and (nullif(trim(p_professor), '') is null or pr.nome = p_professor)
      group by a.nome, t.nome
    ) resumo;
  elsif tipo_normalizado = 'loja' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'pedido', p.id_pedido, 'data', p.criado_em, 'status', p.status,
      'forma_pagamento', p.forma_pagamento, 'total', p.total,
      'itens', (select coalesce(sum(i.quantidade), 0) from public.itens_pedido i where i.id_pedido = p.id_pedido)
    ) order by p.criado_em desc), '[]'::jsonb) into registros
    from public.pedidos p
    where p.criado_em::date between p_inicio and p_fim;
  elsif tipo_normalizado = 'modalidades' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'modalidade', mo.nome, 'turma', t.nome, 'professor', pr.nome,
      'dia', t.dia_semana, 'horario', t.horario, 'capacidade', t.capacidade
    ) order by mo.nome, t.nome), '[]'::jsonb) into registros
    from public.turma t
    left join public.modalidade mo on mo.id_modalidade = t.id_modalidade
    left join public.professor pr on pr.id_professor = t.id_professor
    where (nullif(trim(p_modalidade), '') is null or mo.nome = p_modalidade)
      and (nullif(trim(p_turma), '') is null or t.nome = p_turma)
      and (nullif(trim(p_professor), '') is null or pr.nome = p_professor);
  elsif tipo_normalizado = 'alunos' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'aluno', a.nome, 'email', a.email, 'telefone', a.telefone, 'status', a.status
    ) order by a.nome), '[]'::jsonb) into registros
    from public.aluno a
    where lower(trim(coalesce(a.status, ''))) not in ('inativo', 'inativa', 'cancelado', 'cancelada');
  else
    registros := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'tipo', tipo_normalizado,
    'inicio', p_inicio,
    'fim', p_fim,
    'total', jsonb_array_length(registros),
    'registros', registros,
    'gerado_em', now()
  );
end;
$$;

revoke all on function public.admin_gerar_relatorio(text, date, date, text, text, text) from public;
grant execute on function public.admin_gerar_relatorio(text, date, date, text, text, text) to authenticated;
