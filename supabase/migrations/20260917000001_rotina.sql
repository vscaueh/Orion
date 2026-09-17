-- Fase 2: hábitos do andar Rotina.
--
-- A frequência é o próprio conjunto de dias da semana: um hábito
-- diário é simplesmente aquele que vale nos sete. Um campo só, sem
-- ramificação entre "diário" e "dias específicos" na hora de consultar
-- os hábitos de hoje.

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  weekdays smallint[] not null default '{0,1,2,3,4,5,6}',
  suggested_time time,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (array_length(weekdays, 1) between 1 and 7)
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  -- Um registro por hábito por dia: marcar de novo atualiza.
  unique (habit_id, date)
);

create index habit_logs_habit_id_date_idx on public.habit_logs (habit_id, date desc);

do $$
declare
  t text;
begin
  foreach t in array array['habits', 'habit_logs']
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
