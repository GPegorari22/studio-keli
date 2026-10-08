-- Lista e controla as notificações exibidas no painel administrativo.
create or replace function public.admin_listar_notificacoes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      '_modulo', 'notificacoes',
      'id', c.id_comunicado,
      'nome', c.titulo,
      'conteudo', c.conteudo,
      'data', c.data_envio,
      'tipo', coalesce(c.tipo, 'Informativo'),
      'lido', coalesce(cu.lido, false)
    ) order by c.data_envio desc, c.id_comunicado desc)
    from public.comunicado c
    left join public.comunicado_usuario cu
      on cu.id_comunicado = c.id_comunicado
     and cu.id_usuario = auth.uid()
    where c.id_usuario = auth.uid()
       or cu.id_usuario is not null
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_listar_notificacoes() from public;
grant execute on function public.admin_listar_notificacoes() to authenticated;

create or replace function public.admin_ler_comunicado(p_comunicado integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo não autorizado.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.comunicado c
    where c.id_comunicado = p_comunicado
      and c.id_usuario = auth.uid()
  ) and not exists (
    select 1 from public.comunicado_usuario cu
    where cu.id_comunicado = p_comunicado
      and cu.id_usuario = auth.uid()
  ) then
    raise exception 'Comunicado não encontrado.';
  end if;

  insert into public.comunicado_usuario (id_comunicado, id_usuario, lido, data_leitura)
  values (p_comunicado, auth.uid(), true, now())
  on conflict (id_comunicado, id_usuario)
  do update set lido = true, data_leitura = now();

  return jsonb_build_object('ok', true, 'id_comunicado', p_comunicado);
end;
$$;

revoke all on function public.admin_ler_comunicado(integer) from public;
grant execute on function public.admin_ler_comunicado(integer) to authenticated;
