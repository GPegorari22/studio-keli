-- Conta de desenvolvimento para validar a área da professora.
-- Remova ou altere esta conta antes de publicar o projeto.
do $$
declare
  teacher_id uuid := '00000000-0000-0000-0000-000000000002';
  teacher_profile integer;
  teacher_record integer;
  modality_record integer;
  class_record integer;
  student_record integer;
begin
  select id_perfil into teacher_profile
  from public.perfil
  where lower(trim(nome)) in ('professora', 'professor', 'professores')
  order by id_perfil
  limit 1;
  if teacher_profile is null then
    insert into public.perfil (nome, descricao)
    values ('Professora', 'Acesso pedagógico às próprias turmas')
    returning id_perfil into teacher_profile;
  end if;

  if not exists (select 1 from auth.users where id = teacher_id) then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at
    ) values (
      teacher_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'professora.teste@studiokeli.local', crypt('Professora@12345', gen_salt('bf')),
      now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Professora de Teste"}'::jsonb, now(), now()
    );
  end if;

  insert into public.usuario (id_usuario, email, nome, id_perfil, status)
  values (teacher_id, 'professora.teste@studiokeli.local', 'Professora de Teste', teacher_profile, 'ativo')
  on conflict (id_usuario) do update set email = excluded.email, id_perfil = excluded.id_perfil, status = 'ativo';

  select id_professor into teacher_record
  from public.professor
  where lower(trim(email)) = 'professora.teste@studiokeli.local'
  limit 1;

  if teacher_record is null then
    insert into public.professor (id_usuario, nome, email, status, especialidade)
    values (teacher_id, 'Professora de Teste', 'professora.teste@studiokeli.local', 'ativo', 'Ballet clássico')
    returning id_professor into teacher_record;
  else
    update public.professor set id_usuario = teacher_id, status = 'ativo' where id_professor = teacher_record;
  end if;

  if not exists (select 1 from public.turma where id_professor = teacher_record) then
    select id_modalidade into modality_record from public.modalidade order by id_modalidade limit 1;
    if modality_record is null then
      insert into public.modalidade (nome, descricao, status)
      values ('Ballet clássico', 'Modalidade de desenvolvimento da professora.', 'ativo')
      returning id_modalidade into modality_record;
    end if;
    insert into public.turma (nome, dia_semana, horario, capacidade, id_modalidade, id_professor, status)
    values ('Turma de teste da professora', 'terça-feira', '18:00', 20, modality_record, teacher_record, 'ativo')
    returning id_turma into class_record;
    select id_aluno into student_record from public.aluno where lower(trim(status)) in ('ativo', 'ativa') order by id_aluno limit 1;
    if student_record is not null then
      insert into public.matricula (id_aluno, id_turma, data_matricula, status)
      values (student_record, class_record, current_date, 'ativo');
    end if;
    insert into public.aula (id_turma, data_aula, horario_inicio, horario_fim, status)
    values (class_record, current_date, '18:00', '19:00', 'agendada');
  end if;
end;
$$;
