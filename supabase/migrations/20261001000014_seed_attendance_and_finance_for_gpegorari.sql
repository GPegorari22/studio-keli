-- Dados fictícios para preencher Frequência e Financeiro no perfil de teste.
do $$
declare
  aluno_teste integer;
  professor_teste integer;
  modalidade_teste integer;
  turma_teste integer;
  aula_teste integer;
  mensalidade_teste integer;
  forma_teste integer;
  indice integer;
  dia_teste date;
begin
  select id_aluno into aluno_teste
  from public.aluno
  where lower(trim(email)) = 'gpegorari9@gmail.com'
  limit 1;

  if aluno_teste is null then
    raise exception 'Aluno de teste gpegorari9@gmail.com não foi encontrado.';
  end if;

  select id_professor into professor_teste from public.professor order by id_professor limit 1;
  if professor_teste is null then
    insert into public.professor (nome, email, status) values ('Professora de Teste', 'teste@studiokeli.local', 'ativo') returning id_professor into professor_teste;
  end if;

  select id_modalidade into modalidade_teste from public.modalidade order by id_modalidade limit 1;
  if modalidade_teste is null then
    insert into public.modalidade (nome, descricao, status) values ('Ballet classico', 'Modalidade de teste.', 'ativo') returning id_modalidade into modalidade_teste;
  end if;

  select id_turma into turma_teste from public.turma order by id_turma limit 1;
  if turma_teste is null then
    insert into public.turma (nome, dia_semana, horario, capacidade, id_modalidade, id_professor, status)
    values ('Sala 02 - Ballet classico', 'terca-feira', '08:00', 20, modalidade_teste, professor_teste, 'ativo')
    returning id_turma into turma_teste;
  end if;

  insert into public.matricula (id_aluno, id_turma, data_matricula, status)
  select aluno_teste, turma_teste, current_date, 'ativo'
  where not exists (select 1 from public.matricula where id_aluno = aluno_teste and id_turma = turma_teste);

  for indice in 1..8 loop
    dia_teste := current_date - ((8 - indice) * 7);
    select id_aula into aula_teste from public.aula where id_turma = turma_teste and data_aula = dia_teste limit 1;
    if aula_teste is null then
      insert into public.aula (id_turma, data_aula, horario_inicio, horario_fim, status)
      values (turma_teste, dia_teste, '08:00', '09:00', 'realizada') returning id_aula into aula_teste;
    end if;
    insert into public.frequencia (id_aluno, id_aula, presente)
    values (aluno_teste, aula_teste, indice not in (3, 7))
    on conflict (id_aluno, id_aula) do update set presente = excluded.presente;
  end loop;

  select id_forma_pagamento into forma_teste from public.forma_pagamento order by id_forma_pagamento limit 1;
  if forma_teste is null then
    insert into public.forma_pagamento (descricao) values ('Pix') returning id_forma_pagamento into forma_teste;
  end if;

  for indice in 1..4 loop
    insert into public.mensalidade (id_aluno, competencia, vencimento, valor, status)
    select aluno_teste,
      (current_date - ((4 - indice) * interval '1 month'))::date,
      (current_date - ((4 - indice) * interval '1 month') + interval '10 days')::date,
      180.00,
      case when indice = 4 then 'pendente' else 'pago' end
    where not exists (
      select 1 from public.mensalidade
      where id_aluno = aluno_teste
        and competencia = (current_date - ((4 - indice) * interval '1 month'))::date
    )
    returning id_mensalidade into mensalidade_teste;

    if mensalidade_teste is null then
      select id_mensalidade into mensalidade_teste
      from public.mensalidade
      where id_aluno = aluno_teste
        and competencia = (current_date - ((4 - indice) * interval '1 month'))::date
      limit 1;
    end if;

    if indice < 4 and mensalidade_teste is not null then
      insert into public.pagamento (id_mensalidade, id_forma_pagamento, data_pagamento, valor)
      values (mensalidade_teste, forma_teste, current_date - ((4 - indice) * interval '1 month') + interval '5 days', 180.00)
      on conflict (id_mensalidade) do nothing;
    end if;
  end loop;
end;
$$;
