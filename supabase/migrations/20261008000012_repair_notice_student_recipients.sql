-- Garante que os alunos existentes estejam vinculados ao usuario antes de receber avisos.
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
  id_perfil_aluno integer;
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

  -- Corrige vínculos antigos que já possuem usuario cadastrado pelo mesmo e-mail.
  update public.aluno a
  set id_usuario = u.id_usuario
  from public.usuario u
  where a.id_usuario is null
    and a.email is not null
    and lower(trim(a.email)) = lower(trim(u.email));

  -- Para contas Auth antigas, cria o perfil de usuario antes de vincular o aluno.
  select p.id_perfil
  into id_perfil_aluno
  from public.perfil p
  where lower(trim(p.nome)) in ('aluno', 'alunos', 'estudante', 'estudantes')
  order by p.id_perfil
  limit 1;

  if id_perfil_aluno is not null then
    insert into public.usuario (id_usuario, email, nome, id_perfil, status)
    select au.id, lower(trim(au.email)), coalesce(nullif(trim(a.nome), ''), au.email), id_perfil_aluno, 'ativo'
    from auth.users au
    join public.aluno a on lower(trim(a.email)) = lower(trim(au.email))
    left join public.usuario u on u.id_usuario = au.id
    where u.id_usuario is null
    on conflict (id_usuario) do nothing;

    update public.aluno a
    set id_usuario = u.id_usuario
    from public.usuario u
    where a.id_usuario is null
      and a.email is not null
      and lower(trim(a.email)) = lower(trim(u.email));
  end if;

  insert into public.comunicado (
    id_usuario, titulo, conteudo, data_envio, tipo, fixar, enviar_whatsapp, data_publicacao
  ) values (
    auth.uid(), trim(p_titulo), trim(p_conteudo),
    coalesce(p_data_publicacao, current_date)::timestamp,
    coalesce(nullif(trim(p_tipo), ''), 'Informativo'),
    coalesce(p_fixar, false), coalesce(p_enviar_whatsapp, false),
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
