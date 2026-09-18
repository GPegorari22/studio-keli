-- Cria o usuario da aplicacao e liga o cadastro existente ao Auth User.
-- O e-mail serve apenas para localizar o cadastro no momento da criacao;
-- o painel usa o UUID salvo em id_usuario depois disso.
create or replace function public.vincular_novo_usuario_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_do_usuario text := lower(trim(new.email));
  nome_do_usuario text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(email_do_usuario, '@', 1)
  );
  id_perfil_aluno integer;
  id_perfil_professor integer;
begin
  select id_perfil into id_perfil_aluno
  from public.perfil
  where lower(trim(nome)) in ('aluno', 'alunos', 'estudante', 'estudantes')
  order by id_perfil
  limit 1;

  select id_perfil into id_perfil_professor
  from public.perfil
  where lower(trim(nome)) in ('professor', 'professora', 'professores', 'funcionario', 'funcionário', 'administrador', 'admin')
  order by id_perfil
  limit 1;

  insert into public.usuario (id_usuario, email, nome, id_perfil, status)
  values (
    new.id,
    email_do_usuario,
    nome_do_usuario,
    coalesce(id_perfil_aluno, id_perfil_professor),
    'ativo'
  )
  on conflict (id_usuario) do update
    set email = excluded.email;

  update public.aluno
  set id_usuario = new.id
  where id_usuario is null
    and email is not null
    and lower(trim(email)) = email_do_usuario;

  update public.professor
  set id_usuario = new.id
  where id_usuario is null
    and email is not null
    and lower(trim(email)) = email_do_usuario;

  return new;
end;
$$;

drop trigger if exists depois_de_criar_usuario_auth on auth.users;
create trigger depois_de_criar_usuario_auth
  after insert on auth.users
  for each row
  execute function public.vincular_novo_usuario_auth();

revoke all on function public.vincular_novo_usuario_auth() from public;
grant execute on function public.vincular_novo_usuario_auth() to supabase_auth_admin;