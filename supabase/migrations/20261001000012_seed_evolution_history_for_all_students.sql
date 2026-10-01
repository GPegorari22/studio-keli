-- Garante dados fictícios de evolução para qualquer perfil de aluno vinculado ao Auth.
-- Útil em desenvolvimento quando há mais de um usuário no banco.
do $$
declare
  aluno_teste public.aluno%rowtype;
  professor_teste public.professor%rowtype;
  avaliacao_teste public.avaliacao%rowtype;
  criterio_teste public.criterio_avaliacao%rowtype;
  indice integer;
  criterio_indice integer;
  data_teste date;
  total_alunos integer := 0;
begin
  -- Corrige cadastros de teste antigos que ainda não foram ligados ao usuário Auth.
  update public.aluno as aluno
  set id_usuario = usuario_auth.id
  from auth.users as usuario_auth
  where aluno.id_usuario is null
    and aluno.email is not null
    and lower(trim(aluno.email)) = lower(trim(usuario_auth.email));

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

  for aluno_teste in
    select * from public.aluno where id_usuario is not null order by id_aluno
  loop
    total_alunos := total_alunos + 1;

    for indice in 1..6 loop
      data_teste := current_date - ((6 - indice) * 30);

      select * into avaliacao_teste
      from public.avaliacao
      where id_aluno = aluno_teste.id_aluno and data_avaliacao = data_teste
      order by id_avaliacao
      limit 1;

      if avaliacao_teste.id_avaliacao is null then
        insert into public.avaliacao (id_aluno, id_professor, data_avaliacao, metas, observacoes)
        values (
          aluno_teste.id_aluno,
          professor_teste.id_professor,
          data_teste,
          'Royal Ballet · acompanhamento de evolução',
          case when indice = 6
            then 'Sua evolução técnica está mais segura. Continue trabalhando a flexibilidade e a presença em cena.'
            else 'Avaliação fictícia para validar a trajetória do aluno.'
          end
        )
        returning * into avaliacao_teste;
      end if;

      for criterio_indice in 1..4 loop
        select * into criterio_teste
        from public.criterio_avaliacao
        order by id_criterio
        offset criterio_indice - 1 limit 1;

        if criterio_teste.id_criterio is null then
          insert into public.criterio_avaliacao (nome, descricao)
          values (
            case criterio_indice when 1 then 'Tecnica' when 2 then 'Flexibilidade' when 3 then 'Expressao' else 'Disciplina' end,
            'Criterio para avaliacao do aluno.'
          )
          returning * into criterio_teste;
        end if;

        insert into public.avaliacao_criterio (id_avaliacao, id_criterio, nota, observacao)
        values (
          avaliacao_teste.id_avaliacao,
          criterio_teste.id_criterio,
          least(10, 4.5 + (indice * 0.65) + (criterio_indice * 0.12)),
          'Dado ficticio para teste.'
        )
        on conflict (id_avaliacao, id_criterio) do update
          set nota = excluded.nota, observacao = excluded.observacao;
      end loop;
    end loop;
  end loop;

  if total_alunos = 0 then
    raise notice 'Nenhum aluno vinculado ao Auth foi encontrado.';
  end if;
end;
$$;
