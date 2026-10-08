-- Permite listar, cadastrar e editar turmas pelo painel administrativo.
create or replace function public.salvar_turma_admin(
  p_id_turma integer default null,
  p_nome text default null,
  p_modalidade text default null,
  p_professora text default null,
  p_dia_semana text default null,
  p_horario time default null,
  p_capacidade integer default 20,
  p_status text default 'ativo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  modalidade_id integer;
  professor_id integer;
  turma_atual public.turma%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;
  if nullif(trim(p_nome), '') is null then raise exception 'Informe o nome da turma.'; end if;
  if nullif(trim(p_modalidade), '') is null then raise exception 'Informe a modalidade.'; end if;
  if nullif(trim(p_professora), '') is null then raise exception 'Informe a professora.'; end if;
  if p_capacidade is null or p_capacidade < 1 then raise exception 'Informe uma capacidade válida.'; end if;

  select id_modalidade into modalidade_id from public.modalidade where lower(trim(nome)) = lower(trim(p_modalidade)) limit 1;
  if modalidade_id is null then
    insert into public.modalidade (nome, status) values (trim(p_modalidade), 'ativo') returning id_modalidade into modalidade_id;
  end if;

  select id_professor into professor_id from public.professor where lower(trim(nome)) = lower(trim(p_professora)) limit 1;
  if professor_id is null then
    insert into public.professor (nome, status) values (trim(p_professora), 'ativo') returning id_professor into professor_id;
  end if;

  if p_id_turma is null then
    insert into public.turma (nome, dia_semana, horario, capacidade, id_modalidade, id_professor, status)
    values (trim(p_nome), nullif(trim(p_dia_semana), ''), p_horario, p_capacidade, modalidade_id, professor_id, lower(trim(coalesce(p_status, 'ativo'))))
    returning * into turma_atual;
  else
    update public.turma
    set nome = trim(p_nome), dia_semana = nullif(trim(p_dia_semana), ''), horario = p_horario,
        capacidade = p_capacidade, id_modalidade = modalidade_id, id_professor = professor_id,
        status = lower(trim(coalesce(p_status, 'ativo')))
    where id_turma = p_id_turma
    returning * into turma_atual;
    if turma_atual.id_turma is null then raise exception 'Turma não encontrada.'; end if;
  end if;

  return jsonb_build_object('id', turma_atual.id_turma, 'nome', turma_atual.nome, 'status', turma_atual.status);
end;
$$;

revoke all on function public.salvar_turma_admin(integer, text, text, text, text, time, integer, text) from public;
grant execute on function public.salvar_turma_admin(integer, text, text, text, text, time, integer, text) to authenticated;
