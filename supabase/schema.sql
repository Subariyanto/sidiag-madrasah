-- =====================================================================
-- SiDIAG MADRASAH - Database Schema (PostgreSQL / Supabase)
-- Sistem Asesmen Diagnostik, Minat, dan Preferensi Belajar Siswa Madrasah
-- =====================================================================
-- Jalankan file ini di Supabase SQL Editor pada project baru.
-- Urutan: extensions -> tables -> indexes -> triggers -> RLS policies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. FUNGSI UTILITAS: auto-update kolom updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- 2. TABEL: madrasas
-- Data induk madrasah. Setiap madrasah adalah tenant terpisah.
-- ---------------------------------------------------------------------
create table if not exists public.madrasas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npsn text unique,
  address text,
  phone text,
  email text,
  logo_url text,
  head_master_name text, -- nama kepala madrasah, untuk kop laporan
  status text not null default 'pending_verification'
    check (status in ('pending_verification', 'active', 'suspended', 'inactive')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.madrasas is 'Data induk madrasah (tenant). Diverifikasi Super Admin sebelum aktif.';

create trigger trg_madrasas_updated_at
  before update on public.madrasas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. TABEL: profiles
-- Ekstensi dari auth.users milik Supabase Auth. Menyimpan role & relasi madrasah.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'siswa'
    check (role in ('super_admin', 'admin_madrasah', 'guru', 'guru_bk', 'siswa', 'orang_tua')),
  madrasah_id uuid references public.madrasas(id) on delete set null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Profil pengguna, 1:1 dengan auth.users. role menentukan hak akses.';

create index if not exists idx_profiles_madrasah on public.profiles(madrasah_id);
create index if not exists idx_profiles_role on public.profiles(role);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger: otomatis buat row profiles saat user baru signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'siswa')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. TABEL: teachers
-- Data detail guru (relasi 1:1 opsional dengan profiles jika guru punya akun).
-- ---------------------------------------------------------------------
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid not null references public.madrasas(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  nip text,
  full_name text not null,
  gender text check (gender in ('L', 'P')),
  subject text, -- mata pelajaran / bidang
  is_guru_bk boolean not null default false,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.teachers is 'Data guru per madrasah. is_guru_bk menandai guru BK/Konselor.';

create index if not exists idx_teachers_madrasah on public.teachers(madrasah_id);

create trigger trg_teachers_updated_at
  before update on public.teachers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. TABEL: classes (kelas & rombel)
-- ---------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid not null references public.madrasas(id) on delete cascade,
  name text not null, -- contoh: "VII-A"
  grade_level text, -- contoh: "7", "8", "9"
  homeroom_teacher_id uuid references public.teachers(id) on delete set null,
  academic_year text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.classes is 'Kelas / rombongan belajar per madrasah per tahun ajaran.';

create index if not exists idx_classes_madrasah on public.classes(madrasah_id);

create trigger trg_classes_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. TABEL: students
-- ---------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid not null references public.madrasas(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  nis text,
  nisn text,
  full_name text not null,
  gender text check (gender in ('L', 'P')),
  birth_date date,
  parent_profile_id uuid references public.profiles(id) on delete set null,
  parent_name text,
  parent_phone text,
  status text not null default 'active'
    check (status in ('active', 'graduated', 'transferred', 'inactive')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.students is 'Data siswa per madrasah. Soft delete via is_active/status, jangan hard delete.';

create index if not exists idx_students_madrasah on public.students(madrasah_id);
create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_students_parent_profile on public.students(parent_profile_id);

create trigger trg_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 7. TABEL: assessment_periods
-- Periode asesmen (contoh: "Semester Ganjil 2025/2026").
-- ---------------------------------------------------------------------
create table if not exists public.assessment_periods (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid not null references public.madrasas(id) on delete cascade,
  name text not null,
  academic_year text not null default '',
  start_date date,
  end_date date,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'closed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.assessment_periods is 'Periode pelaksanaan asesmen per madrasah.';

create index if not exists idx_periods_madrasah on public.assessment_periods(madrasah_id);

create trigger trg_periods_updated_at
  before update on public.assessment_periods
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 8. TABEL: instruments
-- Bank instrumen non-kognitif (minat, preferensi belajar, gaya belajar).
-- ---------------------------------------------------------------------
create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasas(id) on delete cascade, -- null = instrumen global/master
  title text not null,
  category text not null
    check (category in ('minat', 'preferensi_belajar', 'non_kognitif_lainnya')),
  description text,
  scale_min smallint not null default 1,
  scale_max smallint not null default 4,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.instruments is 'Bank instrumen non-kognitif. Skala Likert 1-4 default.';

create index if not exists idx_instruments_madrasah on public.instruments(madrasah_id);

create trigger trg_instruments_updated_at
  before update on public.instruments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 9. TABEL: instrument_items
-- Pernyataan/item di dalam sebuah instrumen (skala Likert 1-4).
-- ---------------------------------------------------------------------
create table if not exists public.instrument_items (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  statement text not null,
  dimension text, -- contoh: 'visual', 'auditori', 'kinestetik', dipakai untuk agregasi skor, TIDAK untuk label permanen ke siswa
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.instrument_items is 'Item/pernyataan non-kognitif. dimension untuk agregasi skor internal saja.';

create index if not exists idx_instrument_items_instrument on public.instrument_items(instrument_id);

create trigger trg_instrument_items_updated_at
  before update on public.instrument_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 10. TABEL: cognitive_questions
-- Bank soal kognitif (pilihan ganda / uraian sederhana).
-- ---------------------------------------------------------------------
create table if not exists public.cognitive_questions (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasas(id) on delete cascade,
  subject text,
  question_text text not null,
  question_type text not null default 'multiple_choice'
    check (question_type in ('multiple_choice', 'essay')),
  options jsonb, -- contoh: [{"key":"A","text":"..."}, ...] untuk multiple_choice
  correct_answer text, -- key jawaban benar untuk multiple_choice
  difficulty text default 'sedang' check (difficulty in ('mudah', 'sedang', 'sulit')),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.cognitive_questions is 'Bank soal kognitif untuk asesmen diagnostik kemampuan.';

create index if not exists idx_cognitive_questions_madrasah on public.cognitive_questions(madrasah_id);

create trigger trg_cognitive_questions_updated_at
  before update on public.cognitive_questions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 11. TABEL: assessment_assignments
-- Penugasan asesmen (instrumen/soal) ke siswa pada suatu periode.
-- ---------------------------------------------------------------------
create table if not exists public.assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.assessment_periods(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  instrument_id uuid references public.instruments(id) on delete set null,
  assignment_type text not null default 'instrument'
    check (assignment_type in ('instrument', 'cognitive')),
  status text not null default 'assigned'
    check (status in ('assigned', 'in_progress', 'completed', 'expired')),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.assessment_assignments is 'Penugasan pengerjaan asesmen ke siswa tertentu.';

create index if not exists idx_assignments_period on public.assessment_assignments(period_id);
create index if not exists idx_assignments_student on public.assessment_assignments(student_id);

create trigger trg_assignments_updated_at
  before update on public.assessment_assignments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 12. TABEL: assessment_responses
-- Jawaban siswa per item/pertanyaan (progres tersimpan bertahap).
-- ---------------------------------------------------------------------
create table if not exists public.assessment_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assessment_assignments(id) on delete cascade,
  instrument_item_id uuid references public.instrument_items(id) on delete cascade,
  cognitive_question_id uuid references public.cognitive_questions(id) on delete cascade,
  answer_value smallint, -- untuk skala Likert 1-4
  answer_text text, -- untuk jawaban pilihan ganda/uraian
  is_correct boolean, -- khusus soal kognitif
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint chk_response_target check (
    (instrument_item_id is not null and cognitive_question_id is null) or
    (instrument_item_id is null and cognitive_question_id is not null)
  )
);
comment on table public.assessment_responses is 'Jawaban siswa per item, disimpan progresif saat mengerjakan.';

create index if not exists idx_responses_assignment on public.assessment_responses(assignment_id);
create unique index if not exists uq_responses_assignment_item
  on public.assessment_responses(assignment_id, instrument_item_id)
  where instrument_item_id is not null;
create unique index if not exists uq_responses_assignment_question
  on public.assessment_responses(assignment_id, cognitive_question_id)
  where cognitive_question_id is not null;

-- ---------------------------------------------------------------------
-- 13. TABEL: assessment_results
-- Hasil akhir asesmen per siswa per penugasan (kategori hasil, skor, dsb).
-- Kategori hasil TIDAK BOLEH berupa label permanen kemampuan siswa.
-- ---------------------------------------------------------------------
create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assessment_assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  result_summary jsonb not null default '{}'::jsonb, -- contoh: {"visual": 45, "auditori": 30, "kinestetik": 25} dalam persen, sebagai KECENDERUNGAN bukan label permanen
  category text, -- kategori umum hasil, contoh: 'kecenderungan_seimbang', 'perlu_rujukan_profesional'
  needs_professional_review boolean not null default false, -- flag peringatan saja, TIDAK menentukan keputusan otomatis
  reviewed_by uuid references public.profiles(id) on delete set null, -- guru BK yang meninjau
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.assessment_results is
  'Hasil asesmen sebagai KECENDERUNGAN/preferensi (persentase), bukan label permanen. '
  'needs_professional_review hanya peringatan untuk ditinjau Guru BK, bukan keputusan otomatis sistem.';

create index if not exists idx_results_student on public.assessment_results(student_id);
create index if not exists idx_results_assignment on public.assessment_results(assignment_id);

create trigger trg_results_updated_at
  before update on public.assessment_results
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 14. TABEL: teacher_observations
-- Catatan observasi guru terhadap siswa (pelengkap hasil asesmen).
-- ---------------------------------------------------------------------
create table if not exists public.teacher_observations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete set null,
  observation_date date not null default current_date,
  notes text not null,
  category text, -- contoh: 'akademik', 'perilaku', 'sosial_emosional'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.teacher_observations is 'Observasi guru terhadap siswa, melengkapi hasil asesmen sebelum tindak lanjut.';

create index if not exists idx_observations_student on public.teacher_observations(student_id);

create trigger trg_observations_updated_at
  before update on public.teacher_observations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 15. TABEL: follow_ups
-- Tindak lanjut atas hasil asesmen/observasi (keputusan tetap oleh manusia).
-- ---------------------------------------------------------------------
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  result_id uuid references public.assessment_results(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  action_plan text not null,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'done', 'cancelled')),
  involves_parent boolean not null default false,
  involves_professional_referral boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.follow_ups is 'Rencana tindak lanjut hasil asesmen. Keputusan tetap dibuat manusia (guru/guru BK), bukan otomatis sistem.';

create index if not exists idx_followups_student on public.follow_ups(student_id);

create trigger trg_followups_updated_at
  before update on public.follow_ups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 16. TABEL: activation_codes
-- Kode aktivasi yang dikelola Super Admin, dipakai saat registrasi/login madrasah.
-- ---------------------------------------------------------------------
create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  madrasah_id uuid references public.madrasas(id) on delete set null,
  quota integer not null default 1,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.activation_codes is 'Kode aktivasi madrasah, dikelola Super Admin.';

create index if not exists idx_activation_codes_madrasah on public.activation_codes(madrasah_id);

create trigger trg_activation_codes_updated_at
  before update on public.activation_codes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 17. TABEL: app_settings
-- Pengaturan aplikasi tingkat global/madrasah (ambang kategori, dsb).
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasas(id) on delete cascade, -- null = setting global
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (madrasah_id, setting_key)
);
comment on table public.app_settings is 'Pengaturan aplikasi, misal ambang batas kategori hasil asesmen.';

create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 18. TABEL: activity_logs
-- Log aktivitas pengguna untuk audit.
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  description text,
  created_at timestamptz not null default now()
);
comment on table public.activity_logs is 'Log aktivitas pengguna untuk audit trail.';

create index if not exists idx_activity_logs_user on public.activity_logs(user_id);
create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);

-- =====================================================================
-- 19. ROW LEVEL SECURITY (RLS)
-- =====================================================================
-- Fungsi helper untuk membaca role & madrasah_id user yang sedang login,
-- dipakai berulang di banyak policy agar konsisten dan cepat.

create or replace function public.current_role_name()
returns text
language sql stable security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_madrasah_id()
returns uuid
language sql stable security definer
as $$
  select madrasah_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'super_admin', false);
$$;

-- Aktifkan RLS di semua tabel
alter table public.madrasas enable row level security;
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.assessment_periods enable row level security;
alter table public.instruments enable row level security;
alter table public.instrument_items enable row level security;
alter table public.cognitive_questions enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.assessment_results enable row level security;
alter table public.teacher_observations enable row level security;
alter table public.follow_ups enable row level security;
alter table public.activation_codes enable row level security;
alter table public.app_settings enable row level security;
alter table public.activity_logs enable row level security;

-- ---------------- POLICIES: madrasas ----------------
-- Super admin: full access. Admin madrasah/guru/siswa/ortu: hanya madrasah sendiri.
create policy madrasas_select on public.madrasas
  for select using (
    public.is_super_admin() or id = public.current_madrasah_id()
  );

create policy madrasas_insert_public on public.madrasas
  for insert with check (true); -- registrasi madrasah baru (status pending_verification)

create policy madrasas_update on public.madrasas
  for update using (
    public.is_super_admin() or id = public.current_madrasah_id()
  );

create policy madrasas_delete on public.madrasas
  for delete using (public.is_super_admin());

-- ---------------- POLICIES: profiles ----------------
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.is_super_admin()
    or madrasah_id = public.current_madrasah_id()
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_super_admin());

create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

-- ---------------- POLICIES: teachers ----------------
create policy teachers_select on public.teachers
  for select using (
    public.is_super_admin() or madrasah_id = public.current_madrasah_id()
  );

create policy teachers_write on public.teachers
  for all using (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  ) with check (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  );

-- ---------------- POLICIES: classes ----------------
create policy classes_select on public.classes
  for select using (
    public.is_super_admin() or madrasah_id = public.current_madrasah_id()
  );

create policy classes_write on public.classes
  for all using (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  ) with check (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  );

-- ---------------- POLICIES: students ----------------
-- Siswa hanya lihat data dirinya sendiri. Orang tua hanya lihat anaknya.
-- Guru/admin madrasah lihat data siswa di madrasah sendiri.
create policy students_select on public.students
  for select using (
    public.is_super_admin()
    or madrasah_id = public.current_madrasah_id()
    or profile_id = auth.uid()
    or parent_profile_id = auth.uid()
  );

create policy students_write on public.students
  for all using (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk'))
  ) with check (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk'))
  );

-- ---------------- POLICIES: assessment_periods ----------------
create policy periods_select on public.assessment_periods
  for select using (
    public.is_super_admin() or madrasah_id = public.current_madrasah_id()
  );

create policy periods_write on public.assessment_periods
  for all using (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  ) with check (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  );

-- ---------------- POLICIES: instruments & instrument_items ----------------
create policy instruments_select on public.instruments
  for select using (
    public.is_super_admin()
    or madrasah_id is null -- instrumen master/global bisa dilihat semua
    or madrasah_id = public.current_madrasah_id()
  );

create policy instruments_write on public.instruments
  for all using (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru_bk'))
  ) with check (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru_bk'))
  );

create policy instrument_items_select on public.instrument_items
  for select using (
    exists (
      select 1 from public.instruments i
      where i.id = instrument_items.instrument_id
        and (public.is_super_admin() or i.madrasah_id is null or i.madrasah_id = public.current_madrasah_id())
    )
  );

create policy instrument_items_write on public.instrument_items
  for all using (
    exists (
      select 1 from public.instruments i
      where i.id = instrument_items.instrument_id
        and (public.is_super_admin() or (i.madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru_bk')))
    )
  ) with check (
    exists (
      select 1 from public.instruments i
      where i.id = instrument_items.instrument_id
        and (public.is_super_admin() or (i.madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru_bk')))
    )
  );

-- ---------------- POLICIES: cognitive_questions ----------------
create policy cognitive_questions_select on public.cognitive_questions
  for select using (
    public.is_super_admin()
    or madrasah_id is null
    or madrasah_id = public.current_madrasah_id()
  );

create policy cognitive_questions_write on public.cognitive_questions
  for all using (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru_bk'))
  ) with check (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() in ('admin_madrasah', 'guru_bk'))
  );

-- ---------------- POLICIES: assessment_assignments ----------------
create policy assignments_select on public.assessment_assignments
  for select using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = assessment_assignments.student_id
        and (s.madrasah_id = public.current_madrasah_id() or s.profile_id = auth.uid() or s.parent_profile_id = auth.uid())
    )
  );

create policy assignments_write on public.assessment_assignments
  for all using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = assessment_assignments.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  ) with check (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = assessment_assignments.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  );

-- Siswa boleh update assignment miliknya sendiri (misal status in_progress/completed)
create policy assignments_student_update on public.assessment_assignments
  for update using (
    exists (select 1 from public.students s where s.id = assessment_assignments.student_id and s.profile_id = auth.uid())
  ) with check (
    exists (select 1 from public.students s where s.id = assessment_assignments.student_id and s.profile_id = auth.uid())
  );

-- ---------------- POLICIES: assessment_responses ----------------
create policy responses_select on public.assessment_responses
  for select using (
    public.is_super_admin()
    or exists (
      select 1 from public.assessment_assignments a
      join public.students s on s.id = a.student_id
      where a.id = assessment_responses.assignment_id
        and (s.madrasah_id = public.current_madrasah_id() or s.profile_id = auth.uid() or s.parent_profile_id = auth.uid())
    )
  );

create policy responses_write_student on public.assessment_responses
  for all using (
    exists (
      select 1 from public.assessment_assignments a
      join public.students s on s.id = a.student_id
      where a.id = assessment_responses.assignment_id and s.profile_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.assessment_assignments a
      join public.students s on s.id = a.student_id
      where a.id = assessment_responses.assignment_id and s.profile_id = auth.uid()
    )
  );

-- ---------------- POLICIES: assessment_results ----------------
create policy results_select on public.assessment_results
  for select using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = assessment_results.student_id
        and (s.madrasah_id = public.current_madrasah_id() or s.profile_id = auth.uid() or s.parent_profile_id = auth.uid())
    )
  );

create policy results_write on public.assessment_results
  for all using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = assessment_results.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  ) with check (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = assessment_results.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  );

-- ---------------- POLICIES: teacher_observations ----------------
create policy observations_select on public.teacher_observations
  for select using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = teacher_observations.student_id
        and (s.madrasah_id = public.current_madrasah_id() or s.profile_id = auth.uid() or s.parent_profile_id = auth.uid())
    )
  );

create policy observations_write on public.teacher_observations
  for all using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = teacher_observations.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  ) with check (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = teacher_observations.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  );

-- ---------------- POLICIES: follow_ups ----------------
create policy followups_select on public.follow_ups
  for select using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = follow_ups.student_id
        and (s.madrasah_id = public.current_madrasah_id() or s.profile_id = auth.uid() or s.parent_profile_id = auth.uid())
    )
  );

create policy followups_write on public.follow_ups
  for all using (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = follow_ups.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  ) with check (
    public.is_super_admin()
    or exists (
      select 1 from public.students s
      where s.id = follow_ups.student_id
        and s.madrasah_id = public.current_madrasah_id()
        and public.current_role_name() in ('admin_madrasah', 'guru', 'guru_bk')
    )
  );

-- ---------------- POLICIES: activation_codes (Super Admin only) ----------------
create policy activation_codes_select on public.activation_codes
  for select using (public.is_super_admin() or madrasah_id = public.current_madrasah_id());

create policy activation_codes_write on public.activation_codes
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------- POLICIES: app_settings ----------------
create policy app_settings_select on public.app_settings
  for select using (
    public.is_super_admin()
    or madrasah_id is null
    or madrasah_id = public.current_madrasah_id()
  );

create policy app_settings_write on public.app_settings
  for all using (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  ) with check (
    public.is_super_admin()
    or (madrasah_id = public.current_madrasah_id() and public.current_role_name() = 'admin_madrasah')
  );

-- ---------------- POLICIES: activity_logs ----------------
create policy activity_logs_select on public.activity_logs
  for select using (
    public.is_super_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = activity_logs.user_id and p.madrasah_id = public.current_madrasah_id()
    )
  );

create policy activity_logs_insert on public.activity_logs
  for insert with check (true); -- semua user login boleh menulis log aktivitasnya sendiri

-- =====================================================================
-- SELESAI. Setelah menjalankan schema ini:
-- 1. Buat user pertama via Supabase Auth (signup di aplikasi atau Auth > Users di dashboard).
-- 2. Jalankan: update public.profiles set role = 'super_admin' where email = 'email-anda@contoh.com';
-- 3. Lihat README.md untuk langkah detail.
-- =====================================================================
