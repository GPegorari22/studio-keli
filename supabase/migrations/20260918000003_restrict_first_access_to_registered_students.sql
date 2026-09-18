-- O primeiro acesso só pode criar uma identidade em auth.users quando o e-mail
-- já existir em public.aluno. A função é chamada pelo hook Before User Created
-- do Supabase Auth antes de gravar qualquer usuário de autenticação.

create or replace function public.restringir_cadastro_ao_email_do_aluno(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  email_do_cadastro text := lower(trim(event -> 'user' ->> 'email'));
begin
  if email_do_cadastro is null or email_do_cadastro = '' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Informe um e-mail válido.'
      )
    );
  end if;

  if not exists (
    select 1
    from public.aluno as aluno
    where aluno.email is not null
      and lower(trim(aluno.email)) = email_do_cadastro
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Este e-mail não está habilitado para o primeiro acesso. Peça à administração do Studio para cadastrar ou atualizar seu e-mail.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- Somente o serviço de autenticação pode executar esta função. Ela usa
-- SECURITY DEFINER para consultar a tabela de alunos sem expor e-mails pela API.
revoke all on function public.restringir_cadastro_ao_email_do_aluno(jsonb) from public;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.restringir_cadastro_ao_email_do_aluno(jsonb) to supabase_auth_admin;

comment on function public.restringir_cadastro_ao_email_do_aluno(jsonb) is
  'Hook Before User Created: permite primeiro acesso apenas para e-mails existentes em public.aluno.';
