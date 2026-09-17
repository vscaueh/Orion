-- Fase 3: tabelas internas da Orion.
--
-- orion_jobs fica para a Fase 4, junto com o agendador que vai usá-la
-- para garantir idempotência.

-- Fatos duráveis sobre o usuário — preferências, padrões, decisões.
-- Não é transcrição de conversa: isso são as mensagens.
create table public.orion_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fact text not null,
  category text,
  origin text not null default 'usuario' check (origin in ('usuario', 'inferido')),
  confidence real not null default 1 check (confidence between 0 and 1),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Busca por texto em português, suficiente até precisar de embeddings.
create index orion_memory_fact_idx
  on public.orion_memory
  using gin (to_tsvector('portuguese', fact));

create table public.orion_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null check (channel in ('web', 'telegram')),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.orion_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.orion_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null default '',
  -- Chamadas de tool e seus resultados, para reconstruir o turno.
  tool_calls jsonb,
  tool_call_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index orion_messages_conversation_idx
  on public.orion_messages (conversation_id, created_at);

-- A Orion propõe, o usuário aprova. Toda action que exige aprovação
-- vira uma linha aqui em vez de executar.
create table public.orion_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  summary text not null,
  payload jsonb not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovada', 'rejeitada', 'expirada')),
  result text,
  expires_at timestamptz not null default now() + interval '24 hours',
  resolved_at timestamptz,
  conversation_id uuid references public.orion_conversations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index orion_proposals_pendentes_idx
  on public.orion_proposals (user_id, status, expires_at);

do $$
declare
  t text;
begin
  foreach t in array array[
    'orion_memory', 'orion_conversations', 'orion_messages', 'orion_proposals'
  ]
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
