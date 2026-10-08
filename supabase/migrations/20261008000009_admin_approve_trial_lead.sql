-- Aprova um potencial aluno e cria a matrícula em uma única operação administrativa.
create or replace function public.aprovar_possivel_aluno_admin(
  p_id_possivel_aluno integer,
  p_nome text,
  p_email text,
  p_telefone text,
  p_cpf text,
  p_data_nascimento date,
  p_id_turma integer,
  p_data_matricula date,
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
  lead_atual public.possivel_aluno%rowtype;
  aluno_existente integer;
  resultado jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  select * into lead_atual
  from public.possivel_aluno
  where id_possivel_aluno = p_id_possivel_aluno
    and lower(trim(coalesce(status, ''))) in ('novo', 'pendente');

  if lead_atual.id_possivel_aluno is null then
    raise exception 'Pré-cadastro não encontrado ou já aprovado.';
  end if;

  select id_aluno into aluno_existente
  from public.aluno
  where lower(trim(coalesce(email, ''))) = lower(trim(p_email))
  limit 1;

  select public.criar_matricula_admin(
    p_nome, p_email, p_telefone, p_cpf, p_data_nascimento, p_id_turma,
    p_data_matricula, aluno_existente, p_data_termino, p_plano, p_valor,
    p_vencimento_dia, p_nome_responsavel, p_telefone_responsavel,
    p_email_responsavel, p_observacoes, p_status
  ) into resultado;

  update public.possivel_aluno
  set status = 'CONVERTIDO', id_turma = p_id_turma, data_contato = coalesce(data_contato, current_date)
  where id_possivel_aluno = p_id_possivel_aluno;

  return resultado || jsonb_build_object('id_possivel_aluno', p_id_possivel_aluno, 'lead_status', 'CONVERTIDO');
end;
$$;

revoke all on function public.aprovar_possivel_aluno_admin(integer, text, text, text, text, date, integer, date, date, text, numeric, integer, text, text, text, text, text) from public;
grant execute on function public.aprovar_possivel_aluno_admin(integer, text, text, text, text, date, integer, date, date, text, numeric, integer, text, text, text, text, text) to authenticated;
