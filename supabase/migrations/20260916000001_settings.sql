-- Fase 0: tabela de configurações + função de updated_at.
--
-- settings guarda pares chave/valor por usuário (fuso horário, horários
-- das rotinas do worker, auto_ok da Orion...). value é jsonb para não
-- precisar de migration a cada configuração nova. Diferente das tabelas
-- de domínio, não tem archived_at: configuração se sobrescreve, não se
-- arquiva.

-- Função reutilizável: toda tabela com updated_at vai ganhar um trigger
-- desses nas próximas migrations.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- RLS: mesmo com um único usuário, cada linha só é visível/alterável
-- pelo dono. A anon key é pública por natureza; é esta camada que
-- protege os dados de verdade.
alter table public.settings enable row level security;

create policy "dono seleciona settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "dono insere settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "dono atualiza settings"
  on public.settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dono apaga settings"
  on public.settings for delete
  using (auth.uid() = user_id);
