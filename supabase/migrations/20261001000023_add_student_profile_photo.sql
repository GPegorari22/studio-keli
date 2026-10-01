alter table public.aluno add column if not exists foto_perfil text;

create or replace function public.atualizar_foto_perfil_aluno(p_foto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  aluno_id integer;
begin
  if p_foto is null or length(p_foto) > 600000 then
    raise exception 'A foto é inválida ou excede o tamanho permitido.';
  end if;
  update public.aluno set foto_perfil = p_foto where id_usuario = auth.uid() returning id_aluno into aluno_id;
  if aluno_id is null then raise exception 'Perfil de aluno não encontrado.'; end if;
  return jsonb_build_object('foto_perfil', p_foto);
end;
$$;

grant execute on function public.atualizar_foto_perfil_aluno(text) to authenticated;

create or replace function public.dados_perfil_aluno()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('id', a.id_aluno, 'nome', a.nome, 'email', a.email, 'foto_perfil', a.foto_perfil)
  from public.aluno a
  where a.id_usuario = auth.uid()
  limit 1;
$$;

grant execute on function public.dados_perfil_aluno() to authenticated;
