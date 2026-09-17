-- A tabela public.possivel_aluno já deve existir antes desta migration.
-- O formulário público cria somente leads com status NOVO; ele não cria aluno,
-- matrícula, usuário ou relacionamento com uma turma automaticamente.

alter table public.possivel_aluno enable row level security;

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
