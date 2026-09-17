-- A lista pública de inscrição expõe somente dados de turmas e totais agregados.
-- Nenhum dado de aluno ou matrícula é retornado pela view.
create or replace view public.turmas_disponiveis_inscricao as
select
  t.id_turma,
  t.nome,
  t.dia_semana,
  t.horario,
  t.capacidade,
  count(m.id_matricula) as alunos_matriculados,
  t.capacidade - count(m.id_matricula) as vagas_disponiveis,
  t.id_modalidade,
  md.nome as modalidade_nome
from public.turma as t
join public.modalidade as md
  on md.id_modalidade = t.id_modalidade
left join public.matricula as m
  on m.id_turma = t.id_turma
  and lower(trim(m.status)) = 'ativo'
where lower(trim(t.status)) = 'ativo'
group by
  t.id_turma,
  t.nome,
  t.dia_semana,
  t.horario,
  t.capacidade,
  t.id_modalidade,
  md.nome
having count(m.id_matricula) < t.capacidade;

-- Visitantes precisam consultar somente esta visão agregada para escolher uma turma.
-- As tabelas turma e matricula continuam protegidas pelas respectivas permissões/RLS.
revoke all on table public.turmas_disponiveis_inscricao from public;
grant select on table public.turmas_disponiveis_inscricao to anon, authenticated;
