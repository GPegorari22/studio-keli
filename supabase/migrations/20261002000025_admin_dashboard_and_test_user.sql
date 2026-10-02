-- Área administrativa protegida e usuário fictício somente para desenvolvimento.
-- Remova o usuário de teste antes de publicar o projeto.

insert into public.perfil (nome, descricao)
select 'Administrador', 'Acesso administrativo do Studio'
where not exists (
  select 1 from public.perfil where lower(trim(nome)) in ('administrador', 'admin')
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuario u
    join public.perfil p on p.id_perfil = u.id_perfil
    where u.id_usuario = auth.uid()
      and lower(trim(u.status)) = 'ativo'
      and lower(trim(p.nome)) in ('administrador', 'admin')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.painel_administrativo()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resposta jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'indicadores', jsonb_build_object(
      'alunos_ativos', (select count(*) from public.aluno where lower(status) = 'ativo'),
      'professores_ativos', (select count(*) from public.professor where lower(status) = 'ativo'),
      'turmas_ativas', (select count(*) from public.turma where lower(status) = 'ativa' or lower(status) = 'ativo'),
      'frequencia_media', coalesce((select round(avg(case when f.presente then 100 else 0 end)::numeric, 1) from public.frequencia f join public.aula a on a.id_aula = f.id_aula where a.data_aula >= current_date - 30), 0),
      'pedidos_pendentes', (select count(*) from public.pedido where lower(status) in ('pendente', 'em preparação', 'em preparacao', 'processando'))
    ),
    'agenda', coalesce((select jsonb_agg(jsonb_build_object('id_aula', a.id_aula, 'horario_inicio', a.horario_inicio, 'turma', t.nome, 'modalidade', m.nome, 'professora', p.nome, 'alunos', (select count(*) from public.matricula ma where ma.id_turma = t.id_turma and lower(ma.status) = 'ativa')) order by a.horario_inicio) from public.aula a join public.turma t on t.id_turma = a.id_turma join public.modalidade m on m.id_modalidade = t.id_modalidade join public.professor p on p.id_professor = t.id_professor where a.data_aula = current_date), '[]'::jsonb),
    'frequencia', coalesce((select jsonb_agg(jsonb_build_object('nome', t.nome, 'percentual', round(avg(case when f.presente then 100 else 0 end)::numeric, 1)) order by t.nome) from public.frequencia f join public.aula a on a.id_aula = f.id_aula join public.turma t on t.id_turma = a.id_turma where a.data_aula >= current_date - 30 group by t.id_turma), '[]'::jsonb),
    'atencao', jsonb_build_array(
      jsonb_build_object('tipo', 'Mensalidades vencidas', 'detalhe', (select count(*) || ' aluno(s) precisam de acompanhamento' from public.mensalidade where lower(status) in ('vencida', 'pendente')), 'valor', '!'),
      jsonb_build_object('tipo', 'Solicitações recentes', 'detalhe', (select count(*) || ' aula(s) experimental(is) aguardam retorno' from public.possivel_aluno where lower(status) in ('novo', 'pendente')), 'valor', '?')
    ),
    'alunos_recentes', coalesce((select jsonb_agg(jsonb_build_object('id_aluno', a.id_aluno, 'nome', a.nome, 'email', a.email, 'status', a.status, 'turma', t.nome, 'modalidade', m.nome) order by a.id_aluno desc) from public.aluno a left join public.matricula ma on ma.id_aluno = a.id_aluno and lower(ma.status) = 'ativa' left join public.turma t on t.id_turma = ma.id_turma left join public.modalidade m on m.id_modalidade = t.id_modalidade limit 8), '[]'::jsonb)
  ) into resposta;
  return resposta;
end;
$$;

revoke all on function public.painel_administrativo() from public;
grant execute on function public.painel_administrativo() to authenticated;

-- Conta de teste: admin.teste@studiokeli.local / Admin@12345
do $$
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  admin_profile integer;
begin
  select id_perfil into admin_profile from public.perfil where lower(trim(nome)) in ('administrador', 'admin') order by id_perfil limit 1;
  if not exists (select 1 from auth.users where email = 'admin.teste@studiokeli.local') then
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin.teste@studiokeli.local', crypt('Admin@12345', gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Keli Dalpian"}'::jsonb, now(), now());
  end if;
  insert into public.usuario (id_usuario, email, nome, id_perfil, status)
  values (admin_id, 'admin.teste@studiokeli.local', 'Keli Dalpian', admin_profile, 'ativo')
  on conflict (id_usuario) do update set id_perfil = excluded.id_perfil, status = 'ativo';
end $$;
