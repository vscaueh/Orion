-- Fase 4: registro de execuções das rotinas.
--
-- É o que garante idempotência: antes de agir, a rotina pergunta se já
-- rodou naquela janela. Sem isso, um worker reiniciado às 7h05 mandaria
-- o plano do dia uma segunda vez.

create table public.orion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine text not null,
  -- A janela que esta execução cobre: "2026-09-23" para as diárias,
  -- "2026-09-23T14" para as de hora em hora. Duas execuções da mesma
  -- rotina na mesma chave são a mesma execução.
  slot text not null,
  status text not null default 'ok' check (status in ('ok', 'erro', 'silenciada')),
  result text,
  ran_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (user_id, routine, slot)
);

create index orion_jobs_routine_idx on public.orion_jobs (user_id, routine, ran_at desc);

alter table public.orion_jobs enable row level security;
create policy "dono acessa orion_jobs" on public.orion_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger orion_jobs_set_updated_at
  before update on public.orion_jobs
  for each row execute function public.set_updated_at();
