-- Seed de teste direcionado ao perfil usado no ambiente de desenvolvimento.
do $$
declare
  usuario_teste uuid;
  aluno_teste integer;
  professor_teste integer;
  avaliacao_teste integer;
  criterio_teste integer;
  indice integer;
  criterio_indice integer;
begin
  select id into usuario_teste
  from auth.users
  where lower(email) = 'gpegorari9@gmail.com'
  limit 1;

  if usuario_teste is null then
    raise exception 'Usuário gpegorari9@gmail.com não foi encontrado em auth.users.';
  end if;

  update public.aluno
  set id_usuario = usuario_teste
  where lower(trim(email)) = 'gpegorari9@gmail.com';

  select id_aluno into aluno_teste
  from public.aluno
  where id_usuario = usuario_teste
  limit 1;

  if aluno_teste is null then
    raise exception 'Não existe aluno em public.aluno com o e-mail gpegorari9@gmail.com.';
  end if;

  select id_professor into professor_teste
  from public.professor
  where status is null or lower(trim(status)) = 'ativo'
  order by id_professor
  limit 1;

  if professor_teste is null then
    insert into public.professor (nome, email, status)
    values ('Professora de Teste', 'teste@studiokeli.local', 'ativo')
    returning id_professor into professor_teste;
  end if;

  for indice in 1..6 loop
    select id_avaliacao into avaliacao_teste
    from public.avaliacao
    where id_aluno = aluno_teste
      and data_avaliacao = current_date - ((6 - indice) * 30)
    order by id_avaliacao
    limit 1;

    if avaliacao_teste is null then
      insert into public.avaliacao (id_aluno, id_professor, data_avaliacao, metas, observacoes)
      values (
        aluno_teste,
        professor_teste,
        current_date - ((6 - indice) * 30),
        'Royal Ballet · acompanhamento de evolução',
        'Avaliação fictícia para validar a tela de evolução.'
      )
      returning id_avaliacao into avaliacao_teste;
    end if;

    for criterio_indice in 1..4 loop
      select id_criterio into criterio_teste
      from public.criterio_avaliacao
      order by id_criterio
      offset criterio_indice - 1 limit 1;

      if criterio_teste is null then
        insert into public.criterio_avaliacao (nome, descricao)
        values (case criterio_indice when 1 then 'Tecnica' when 2 then 'Flexibilidade' when 3 then 'Expressao' else 'Disciplina' end, 'Critério para avaliação do aluno.')
        returning id_criterio into criterio_teste;
      end if;

      insert into public.avaliacao_criterio (id_avaliacao, id_criterio, nota, observacao)
      values (avaliacao_teste, criterio_teste, least(10, 4.5 + indice * 0.65 + criterio_indice * 0.12), 'Dado fictício para teste.')
      on conflict (id_avaliacao, id_criterio) do update
        set nota = excluded.nota, observacao = excluded.observacao;
    end loop;
  end loop;
end;
$$;
