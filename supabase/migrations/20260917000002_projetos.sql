-- Fase 2: andar Projetos.
--
-- project_activity (do modelo no CLAUDE.md) fica para a Fase 5, junto
-- com a integração do GitHub que vai alimentá-la — criar a tabela agora
-- seria estrutura vazia. Enquanto isso, "projeto parado" se mede pelo
-- updated_at.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('freela', 'pessoal', 'portfolio', 'candidatura')),
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'concluido')),
  next_step text,
  client text,
  due_on date,
  repo_url text,
  deploy_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  -- Duração estimada: é o que permite à Orion encaixar a tarefa numa
  -- janela livre na Fase 4.
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  priority text not null default 'media' check (priority in ('alta', 'media', 'baixa')),
  due_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index projects_status_idx on public.projects (user_id, status);
create index project_tasks_project_id_idx on public.project_tasks (project_id);
create index project_tasks_due_on_idx on public.project_tasks (user_id, due_on);

do $$
declare
  t text;
begin
  foreach t in array array['projects', 'project_tasks']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "dono acessa %s" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t
    );
    execute format(
      'create trigger %s_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;
