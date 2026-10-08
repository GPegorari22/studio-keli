-- Cria uma matrícula pelo painel administrativo e mantém os dados complementares
-- preenchidos no modal junto da matrícula.
alter table public.matricula add column if not exists data_termino date;
alter table public.matricula add column if not exists plano text;
alter table public.matricula add column if not exists valor_matricula numeric(10, 2);
alter table public.matricula add column if not exists vencimento_dia smallint;
alter table public.matricula add column if not exists nome_responsavel text;
alter table public.matricula add column if not exists telefone_responsavel text;
alter table public.matricula add column if not exists email_responsavel text;
alter table public.matricula add column if not exists observacoes text;
alter table public.aluno add column if not exists data_nascimento date;

create or replace function public.criar_matricula_admin(
  p_nome text,
  p_email text,
  p_telefone text,
  p_cpf text,
  p_data_nascimento date,
  p_id_turma integer,
  p_data_matricula date,
  p_id_aluno integer default null,
  p_data_termino date default null,
  p_plano text default 'Mensal',
  p_valor numeric default null,
  p_vencimento_dia integer default 10,
  p_nome_responsavel text default null,
  p_telefone_responsavel text default null,
  p_email_responsavel text default null,
  p_observacoes text default null,
  p_status text default 'Ativa'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  aluno_id integer := p_id_aluno;
  matricula_nova public.matricula%rowtype;
  status_novo text := case
    when lower(trim(coalesce(p_status, ''))) like 'pendente%' then 'pendente'
    else 'ativo'
  end;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if nullif(trim(p_nome), '') is null then
    raise exception 'Informe o nome completo.';
  end if;
  if nullif(trim(p_email), '') is null or position('@' in p_email) = 0 then
    raise exception 'Informe um e-mail válido.';
  end if;
  if p_id_turma is null or not exists (select 1 from public.turma where id_turma = p_id_turma) then
    raise exception 'Selecione uma turma válida.';
  end if;
  if p_data_matricula is null then
    raise exception 'Informe a data de início.';
  end if;
  if p_vencimento_dia not between 1 and 31 then
    raise exception 'Informe um dia de vencimento válido.';
  end if;

  if aluno_id is null then
    insert into public.aluno (nome, email, telefone, cpf, data_nascimento, status)
    values (trim(p_nome), lower(trim(p_email)), nullif(trim(p_telefone), ''), nullif(trim(p_cpf), ''), p_data_nascimento, status_novo)
    returning id_aluno into aluno_id;
  else
    update public.aluno
    set nome = trim(p_nome),
        email = lower(trim(p_email)),
        telefone = nullif(trim(p_telefone), ''),
        cpf = nullif(trim(p_cpf), ''),
        data_nascimento = p_data_nascimento
    where id_aluno = aluno_id;

    if not found then
      raise exception 'Aluno não encontrado.';
    end if;
  end if;

  if exists (
    select 1
    from public.matricula
    where id_aluno = aluno_id
      and id_turma = p_id_turma
      and lower(trim(status)) in ('ativo', 'ativa', 'pendente', 'aguardando confirmação', 'aguardando confirmacao', 'aguardando_confirmacao')
  ) then
    raise exception 'Este aluno já possui uma matrícula nesta turma.';
  end if;

  insert into public.matricula (
    id_aluno, id_turma, data_matricula, data_termino, status,
    plano, valor_matricula, vencimento_dia, nome_responsavel,
    telefone_responsavel, email_responsavel, observacoes
  )
  values (
    aluno_id, p_id_turma, p_data_matricula, p_data_termino, status_novo,
    nullif(trim(p_plano), ''), p_valor, p_vencimento_dia, nullif(trim(p_nome_responsavel), ''),
    nullif(trim(p_telefone_responsavel), ''), nullif(trim(p_email_responsavel), ''), nullif(trim(p_observacoes), '')
  )
  returning * into matricula_nova;

  return jsonb_build_object(
    'id_matricula', matricula_nova.id_matricula,
    'id_aluno', aluno_id,
    'id_turma', matricula_nova.id_turma,
    'data_matricula', matricula_nova.data_matricula,
    'status', matricula_nova.status
  );
end;
$$;

revoke all on function public.criar_matricula_admin(text, text, text, text, date, integer, date, integer, date, text, numeric, integer, text, text, text, text, text) from public;
grant execute on function public.criar_matricula_admin(text, text, text, text, date, integer, date, integer, date, text, numeric, integer, text, text, text, text, text) to authenticated;
