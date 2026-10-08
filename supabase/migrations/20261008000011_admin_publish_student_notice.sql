-- Publica avisos administrativos e cria uma notificação individual para cada aluno.
alter table public.comunicado
  add column if not exists tipo text not null default 'Informativo',
  add column if not exists fixar boolean not null default false,
  add column if not exists enviar_whatsapp boolean not null default false,
  add column if not exists data_publicacao date;

create or replace function public.publicar_aviso_admin(
  p_titulo text,
  p_conteudo text,
  p_data_publicacao date default current_date,
  p_tipo text default 'Informativo',
  p_destinatarios text default 'alunos',
  p_fixar boolean default true,
  p_enviar_whatsapp boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  id_aviso integer;
  total_destinatarios integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  if nullif(trim(p_titulo), '') is null then
    raise exception 'Informe o título do aviso.' using errcode = '22023';
  end if;
  if nullif(trim(p_conteudo), '') is null then
    raise exception 'Informe a mensagem do aviso.' using errcode = '22023';
  end if;

  insert into public.comunicado (
    id_usuario,
    titulo,
    conteudo,
    data_envio,
    tipo,
    fixar,
    enviar_whatsapp,
    data_publicacao
  ) values (
    auth.uid(),
    trim(p_titulo),
    trim(p_conteudo),
    coalesce(p_data_publicacao, current_date)::timestamp,
    coalesce(nullif(trim(p_tipo), ''), 'Informativo'),
    coalesce(p_fixar, false),
    coalesce(p_enviar_whatsapp, false),
    coalesce(p_data_publicacao, current_date)
  )
  returning id_comunicado into id_aviso;

  if lower(trim(coalesce(p_destinatarios, 'alunos'))) in ('alunos', 'todos') then
    insert into public.comunicado_usuario (id_comunicado, id_usuario, lido)
    select id_aviso, a.id_usuario, false
    from public.aluno a
    where a.id_usuario is not null
      and not exists (
        select 1
        from public.comunicado_usuario cu
        where cu.id_comunicado = id_aviso
          and cu.id_usuario = a.id_usuario
      );
    get diagnostics total_destinatarios = row_count;
  end if;

  return jsonb_build_object(
    'id_comunicado', id_aviso,
    'destinatarios', total_destinatarios,
    'data_publicacao', coalesce(p_data_publicacao, current_date)
  );
end;
$$;

revoke all on function public.publicar_aviso_admin(text, text, date, text, text, boolean, boolean) from public;
grant execute on function public.publicar_aviso_admin(text, text, date, text, text, boolean, boolean) to authenticated;

-- Lista os avisos recebidos pelo aluno autenticado.
create or replace function public.listar_comunicados_aluno()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id_comunicado,
      'titulo', c.titulo,
      'conteudo', c.conteudo,
      'data', c.data_envio,
      'tipo', coalesce(c.tipo, 'Informativo'),
      'fixar', coalesce(c.fixar, false),
      'lido', cu.lido
    ) order by coalesce(c.fixar, false) desc, c.data_envio desc, c.id_comunicado desc)
    from public.comunicado_usuario cu
    join public.comunicado c on c.id_comunicado = cu.id_comunicado
    where cu.id_usuario = auth.uid()
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.listar_comunicados_aluno() from public;
grant execute on function public.listar_comunicados_aluno() to authenticated;

create or replace function public.marcar_comunicado_aluno_lido(p_comunicado integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.comunicado_usuario
  set lido = true, data_leitura = now()
  where id_comunicado = p_comunicado
    and id_usuario = auth.uid();

  return jsonb_build_object('ok', true, 'id_comunicado', p_comunicado);
end;
$$;

revoke all on function public.marcar_comunicado_aluno_lido(integer) from public;
grant execute on function public.marcar_comunicado_aluno_lido(integer) to authenticated;
