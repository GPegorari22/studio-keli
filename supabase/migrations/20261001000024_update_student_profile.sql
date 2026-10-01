-- Permite ao aluno editar os dados básicos do próprio perfil.
alter table public.aluno add column if not exists telefone text;
alter table public.aluno add column if not exists cpf text;

create or replace function public.atualizar_dados_perfil_aluno(
  p_nome text,
  p_email text,
  p_telefone text default null,
  p_cpf text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil public.aluno%rowtype;
begin
  if nullif(trim(p_nome), '') is null then
    raise exception 'Informe o nome completo.';
  end if;
  if nullif(trim(p_email), '') is null or position('@' in p_email) = 0 then
    raise exception 'Informe um e-mail válido.';
  end if;

  update public.aluno
  set nome = trim(p_nome),
      email = lower(trim(p_email)),
      telefone = nullif(trim(p_telefone), ''),
      cpf = nullif(trim(p_cpf), '')
  where id_usuario = auth.uid()
  returning * into perfil;

  if perfil.id_aluno is null then
    raise exception 'Perfil de aluno não encontrado.';
  end if;

  return jsonb_build_object(
    'id', perfil.id_aluno,
    'nome', perfil.nome,
    'email', perfil.email,
    'telefone', perfil.telefone,
    'cpf', perfil.cpf,
    'foto_perfil', perfil.foto_perfil
  );
end;
$$;

grant execute on function public.atualizar_dados_perfil_aluno(text, text, text, text) to authenticated;

create or replace function public.dados_perfil_aluno()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', a.id_aluno,
    'nome', a.nome,
    'email', a.email,
    'telefone', a.telefone,
    'cpf', a.cpf,
    'foto_perfil', a.foto_perfil
  )
  from public.aluno a
  where a.id_usuario = auth.uid()
  limit 1;
$$;

grant execute on function public.dados_perfil_aluno() to authenticated;
