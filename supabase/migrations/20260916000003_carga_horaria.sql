-- Troca o limite de faltas digitado à mão pela carga horária da cadeira.
--
-- O limite de 25% passa a ser calculado a partir da carga horária (o
-- número que está no plano de ensino), em vez de o usuário fazer a
-- conta de cabeça e digitar o resultado.

alter table public.courses drop column absence_limit;
alter table public.courses add column total_hours integer
  check (total_hours is null or total_hours > 0);

comment on column public.courses.total_hours is
  'Carga horária da cadeira em horas-aula (ex.: 64). Base do limite de 25% de faltas.';
