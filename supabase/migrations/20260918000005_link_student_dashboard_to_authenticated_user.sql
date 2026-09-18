-- Relaciona o painel ao aluno pelo UUID do usuario autenticado.
create or replace function public.meu_painel_aluno()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  id_do_usuario uuid := auth.uid();
  aluno_atual public.aluno%rowtype;
begin
  if id_do_usuario is null then
    return jsonb_build_object('erro', 'Sessao invalida. Entre novamente para acessar seu perfil.');
  end if;

  select aluno.*
    into aluno_atual
  from public.aluno as aluno
  where aluno.id_usuario = id_do_usuario
  limit 1;

  if aluno_atual.id_aluno is null then
    return jsonb_build_object('erro', 'Nao encontramos um perfil de aluno vinculado a este usuario.');
  end if;

  return jsonb_build_object(
    'aluno', jsonb_build_object(
      'id', aluno_atual.id_aluno,
      'nome', aluno_atual.nome,
      'email', aluno_atual.email
    ),
    'proxima_aula', (
      select jsonb_build_object(
        'id_aula', aula.id_aula,
        'data', aula.data_aula,
        'horario_inicio', aula.horario_inicio,
        'horario_fim', aula.horario_fim,
        'turma', turma.nome,
        'modalidade', modalidade.nome
      )
      from public.aula as aula
      join public.turma as turma on turma.id_turma = aula.id_turma
      join public.modalidade as modalidade on modalidade.id_modalidade = turma.id_modalidade
      join public.matricula as matricula on matricula.id_turma = turma.id_turma
      where matricula.id_aluno = aluno_atual.id_aluno
        and lower(trim(matricula.status)) = 'ativo'
        and aula.data_aula >= current_date
      order by aula.data_aula, aula.horario_inicio
      limit 1
    ),
    'aulas', coalesce((
      select jsonb_agg(aulas_do_aluno order by (aulas_do_aluno ->> 'data'), (aulas_do_aluno ->> 'horario_inicio'))
      from (
        select jsonb_build_object(
          'id_aula', aula.id_aula,
          'data', aula.data_aula,
          'horario_inicio', aula.horario_inicio,
          'horario_fim', aula.horario_fim,
          'turma', turma.nome,
          'modalidade', modalidade.nome
        ) as aulas_do_aluno
        from public.aula as aula
        join public.turma as turma on turma.id_turma = aula.id_turma
        join public.modalidade as modalidade on modalidade.id_modalidade = turma.id_modalidade
        join public.matricula as matricula on matricula.id_turma = turma.id_turma
        where matricula.id_aluno = aluno_atual.id_aluno
          and lower(trim(matricula.status)) = 'ativo'
          and aula.data_aula between current_date - 31 and current_date + 45
        order by aula.data_aula, aula.horario_inicio
        limit 24
      ) as aulas_agendadas
    ), '[]'::jsonb),
    'frequencia', (
      select jsonb_build_object(
        'presencas', count(*) filter (where frequencia.presente),
        'faltas', count(*) filter (where not frequencia.presente),
        'total', count(*),
        'percentual', case
          when count(*) = 0 then null
          else round((count(*) filter (where frequencia.presente)::numeric / count(*)::numeric) * 100)
        end
      )
      from public.frequencia as frequencia
      where frequencia.id_aluno = aluno_atual.id_aluno
    ),
    'criterios', coalesce((
      select jsonb_agg(
        jsonb_build_object('nome', criterio.nome, 'nota', avaliacao_criterio.nota)
        order by criterio.nome
      )
      from public.avaliacao_criterio as avaliacao_criterio
      join public.criterio_avaliacao as criterio
        on criterio.id_criterio = avaliacao_criterio.id_criterio
      where avaliacao_criterio.id_avaliacao = (
        select avaliacao.id_avaliacao
        from public.avaliacao as avaliacao
        where avaliacao.id_aluno = aluno_atual.id_aluno
        order by avaliacao.data_avaliacao desc, avaliacao.id_avaliacao desc
        limit 1
      )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.confirmar_presenca_da_proxima_aula(id_da_aula integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  id_do_aluno integer;
begin
  select aluno.id_aluno
    into id_do_aluno
  from public.aluno as aluno
  where aluno.id_usuario = auth.uid()
  limit 1;

  if id_do_aluno is null then
    raise exception 'Perfil de aluno nao encontrado.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.aula as aula
    join public.matricula as matricula on matricula.id_turma = aula.id_turma
    where aula.id_aula = id_da_aula
      and aula.data_aula = current_date
      and matricula.id_aluno = id_do_aluno
      and lower(trim(matricula.status)) = 'ativo'
  ) then
    raise exception 'A presenca so pode ser confirmada na aula de hoje.' using errcode = '22023';
  end if;

  update public.frequencia
    set presente = true
  where id_aula = id_da_aula
    and id_aluno = id_do_aluno;

  if not found then
    insert into public.frequencia (id_aula, id_aluno, presente)
    values (id_da_aula, id_do_aluno, true);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.meu_painel_aluno() to authenticated;
grant execute on function public.confirmar_presenca_da_proxima_aula(integer) to authenticated;
