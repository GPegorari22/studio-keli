-- Dados ficticios para testar o painel do aluno.
-- Execute uma vez no SQL Editor do Supabase.
-- O aluno usado e o primeiro registro com id_usuario preenchido.

do $$
declare
  aluno_teste public.aluno%rowtype;
  professor_teste public.professor%rowtype;
  modalidade_teste public.modalidade%rowtype;
  turma_teste public.turma%rowtype;
  aula_teste public.aula%rowtype;
  avaliacao_teste public.avaliacao%rowtype;
  criterio_teste public.criterio_avaliacao%rowtype;
  dia_teste date;
  indice integer;
begin
  select * into aluno_teste
  from public.aluno
  where id_usuario is not null
  order by id_aluno
  limit 1;

  if aluno_teste.id_aluno is null then
    raise exception 'Nenhum aluno esta vinculado a um usuario. Preencha aluno.id_usuario antes de inserir os dados de teste.';
  end if;

  select * into professor_teste
  from public.professor
  where status is null or lower(trim(status)) = 'ativo'
  order by id_professor
  limit 1;

  if professor_teste.id_professor is null then
    insert into public.professor (nome, email, status)
    values ('Professora de Teste', 'teste@studiokeli.local', 'ativo')
    returning * into professor_teste;
  end if;

  select * into modalidade_teste
  from public.modalidade
  where lower(trim(nome)) = 'ballet classico'
  limit 1;

  if modalidade_teste.id_modalidade is null then
    insert into public.modalidade (nome, descricao, status)
    values ('Ballet classico', 'Modalidade criada para teste do painel.', 'ativo')
    returning * into modalidade_teste;
  end if;

  select * into turma_teste
  from public.turma
  where nome = 'Sala 02 - Ballet classico'
  limit 1;

  if turma_teste.id_turma is null then
    insert into public.turma (nome, dia_semana, horario, capacidade, id_modalidade, id_professor, status)
    values ('Sala 02 - Ballet classico', 'terca-feira', '08:00', 20, modalidade_teste.id_modalidade, professor_teste.id_professor, 'ativo')
    returning * into turma_teste;
  end if;

  if not exists (
    select 1 from public.matricula
    where id_aluno = aluno_teste.id_aluno and id_turma = turma_teste.id_turma
  ) then
    insert into public.matricula (id_aluno, id_turma, data_matricula, status)
    values (aluno_teste.id_aluno, turma_teste.id_turma, current_date, 'ativo');
  end if;

  for indice in 1..8 loop
    dia_teste := current_date - ((8 - indice) * 7);

    if not exists (
      select 1 from public.aula
      where id_turma = turma_teste.id_turma and data_aula = dia_teste
    ) then
      insert into public.aula (id_turma, data_aula, horario_inicio, horario_fim, status)
      values (turma_teste.id_turma, dia_teste, '08:00', '09:00', 'realizada')
      returning * into aula_teste;
    else
      select * into aula_teste from public.aula
      where id_turma = turma_teste.id_turma and data_aula = dia_teste
      order by id_aula limit 1;
    end if;

    if not exists (
      select 1 from public.frequencia
      where id_aluno = aluno_teste.id_aluno and id_aula = aula_teste.id_aula
    ) then
      insert into public.frequencia (id_aluno, id_aula, presente)
      values (aluno_teste.id_aluno, aula_teste.id_aula, indice <> 3 and indice <> 7);
    end if;
  end loop;

  for indice in 1..4 loop
    dia_teste := current_date + (indice * 7);

    if not exists (
      select 1 from public.aula
      where id_turma = turma_teste.id_turma and data_aula = dia_teste
    ) then
      insert into public.aula (id_turma, data_aula, horario_inicio, horario_fim, status)
      values (turma_teste.id_turma, dia_teste, '08:00', '09:00', 'agendada');
    end if;
  end loop;

  select * into avaliacao_teste
  from public.avaliacao
  where id_aluno = aluno_teste.id_aluno
  order by data_avaliacao desc, id_avaliacao desc
  limit 1;

  if avaliacao_teste.id_avaliacao is null then
    insert into public.avaliacao (id_aluno, id_professor, data_avaliacao, metas, observacoes)
    values (
      aluno_teste.id_aluno,
      professor_teste.id_professor,
      current_date,
      'Manter a frequencia e ampliar a expressao corporal.',
      'Avaliacao ficticia para validar o painel.'
    )
    returning * into avaliacao_teste;
  end if;

  for indice in 1..4 loop
    select * into criterio_teste
    from public.criterio_avaliacao
    order by id_criterio
    offset indice - 1 limit 1;

    if criterio_teste.id_criterio is null then
      insert into public.criterio_avaliacao (nome, descricao)
      values (
        case indice
          when 1 then 'Tecnica'
          when 2 then 'Flexibilidade'
          when 3 then 'Expressao'
          else 'Disciplina'
        end,
        'Criterio para avaliacao do aluno.'
      )
      returning * into criterio_teste;
    end if;

    if not exists (
      select 1 from public.avaliacao_criterio
      where id_avaliacao = avaliacao_teste.id_avaliacao
        and id_criterio = criterio_teste.id_criterio
    ) then
      insert into public.avaliacao_criterio (id_avaliacao, id_criterio, nota, observacao)
      values (avaliacao_teste.id_avaliacao, criterio_teste.id_criterio, 5.2 + (indice * 0.8), 'Dado ficticio para teste.');
    end if;
  end loop;
end;
$$;
