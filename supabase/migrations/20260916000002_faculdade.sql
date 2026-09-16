-- Fase 1: tabelas do andar Faculdade + time_blocks (do andar Rotina).
--
-- time_blocks entra agora porque a Fase 1 gera blocos de "aula" a
-- partir de class_slots; o resto do andar Rotina chega na Fase 2.
--
-- RLS: uma policy "for all" por tabela (cobre select/insert/update/
-- delete de uma vez) — mais enxuto que as quatro policies separadas
-- da settings, com o mesmo efeito: cada linha só existe para o dono.

-- Semestres (grão do andar: tudo pende de um semestre)
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Cadeiras
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  semester_id uuid not null references public.semesters (id) on delete cascade,
  name text not null,
  code text,
  professor text,
  color text,
  absence_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Horário das aulas (0 = domingo … 6 = sábado)
create table public.class_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (ends_at > starts_at)
);

-- Avaliações (nota fica nula até sair o resultado)
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  type text,
  date date,
  weight numeric(5, 2),
  grade numeric(4, 2) check (grade is null or (grade >= 0 and grade <= 10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Faltas
create table public.absences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  date date not null,
  justified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Materiais da cadeira (links)
create table public.course_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Semana-tipo (andar Rotina). class_slot_id liga o bloco gerado à aula
-- de origem: se o horário da aula mudar, o bloco é regenerado.
create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  source text not null default 'manual' check (source in ('manual', 'generated')),
  class_slot_id uuid references public.class_slots (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (ends_at > starts_at)
);

-- Índices: FKs usadas em joins e filtros frequentes
create index courses_semester_id_idx on public.courses (semester_id);
create index class_slots_course_id_idx on public.class_slots (course_id);
create index assessments_course_id_idx on public.assessments (course_id);
create index absences_course_id_idx on public.absences (course_id);
create index course_materials_course_id_idx on public.course_materials (course_id);
create index time_blocks_class_slot_id_idx on public.time_blocks (class_slot_id);

-- RLS + trigger de updated_at para todas as tabelas novas
do $$
declare
  t text;
begin
  foreach t in array array[
    'semesters', 'courses', 'class_slots', 'assessments',
    'absences', 'course_materials', 'time_blocks'
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
