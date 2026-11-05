-- Math Adventure - database untuk Supabase.
-- Jalankan seluruh skrip ini di Supabase Dashboard > SQL Editor.
-- Data hasil belajar hanya dapat DIBACA oleh akun guru yang terautentikasi.
-- Peran anon hanya dapat MENAMBAHKAN profil dan hasil (tanpa akses baca).

create table if not exists public.app_students (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  class_name text not null default '' check (char_length(class_name) <= 30),
  created_at timestamptz not null default now()
);

create table if not exists public.app_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.app_students(id) on delete set null,
  student_name text not null check (char_length(student_name) between 1 and 60),
  class_name text not null default '' check (char_length(class_name) <= 30),
  topic_id text not null,
  topic_name text not null,
  correct smallint not null check (correct between 0 and 20),
  total smallint not null default 20 check (total = 20),
  score smallint not null check (score between 0 and 20),
  level smallint not null check (level between 1 and 3),
  created_at timestamptz not null default now()
);

create index if not exists app_results_created_at_idx on public.app_results (created_at desc);
create index if not exists app_results_student_id_idx on public.app_results (student_id);

alter table public.app_students enable row level security;
alter table public.app_results enable row level security;

drop policy if exists "Students can be added by app users" on public.app_students;
create policy "Students can be added by app users"
  on public.app_students for insert to anon, authenticated
  with check (true);

drop policy if exists "Teachers can read students" on public.app_students;
create policy "Teachers can read students"
  on public.app_students for select to authenticated
  using (true);

drop policy if exists "Results can be added by app users" on public.app_results;
create policy "Results can be added by app users"
  on public.app_results for insert to anon, authenticated
  with check (true);

drop policy if exists "Teachers can read results" on public.app_results;
create policy "Teachers can read results"
  on public.app_results for select to authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant insert on table public.app_students to anon, authenticated;
grant select on table public.app_students to authenticated;
grant insert on table public.app_results to anon, authenticated;
grant select on table public.app_results to authenticated;
