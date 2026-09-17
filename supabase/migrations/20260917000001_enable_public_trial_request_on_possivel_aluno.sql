-- A tabela public.possivel_aluno já deve existir antes desta migration.
-- O formulário público cria somente leads com status NOVO; ele não cria aluno,
-- matrícula, usuário ou relacionamento com uma turma automaticamente.

alter table public.possivel_aluno enable row level security;

-- A policy controla quais linhas podem ser criadas; estes grants permitem que o
-- formulário público use INSERT e a sequência da coluna de identidade, sem
-- conceder SELECT, UPDATE ou DELETE.
grant insert on table public.possivel_aluno to anon, authenticated;

do $$
declare
  identity_sequence text;
begin
  select pg_get_serial_sequence('public.possivel_aluno', 'id_possivel_aluno')
    into identity_sequence;

  if identity_sequence is not null then
    execute format('grant usage on sequence %s to anon, authenticated', identity_sequence);
  end if;
end;
$$;

-- Visitantes podem somente enviar dados pelo formulário. Não há policy pública de
-- SELECT, UPDATE ou DELETE para não expor telefones, e-mails e dados pessoais.
drop policy if exists "enviar_possivel_aluno_aula_experimental" on public.possivel_aluno;

create policy "enviar_possivel_aluno_aula_experimental"
on public.possivel_aluno
for insert
to anon, authenticated
with check (
  status = 'NOVO'
  and origem = 'SITE - AULA EXPERIMENTAL'
  and char_length(trim(nome)) between 2 and 150
  and char_length(trim(telefone)) between 8 and 20
);

comment on policy "enviar_possivel_aluno_aula_experimental" on public.possivel_aluno is
  'Permite apenas o envio público de leads pela aula experimental.';
