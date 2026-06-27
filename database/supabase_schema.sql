-- RankBooster Supabase schema
-- Supabase dashboard -> SQL Editor -> New query -> paste all -> Run.

create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null default 'local-only',
  display_name text not null default 'Student',
  role text not null default 'user',
  avatar_initials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists courses (
  id text primary key,
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  badge text,
  price_inr integer not null default 0,
  original_price_inr integer,
  accent_color text default '#7C3AED',
  text_color text default '#A78BFA',
  subjects_json jsonb not null default '[]'::jsonb,
  folders_json jsonb not null default '[]'::jsonb,
  config_json jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tests (
  id text primary key,
  course_id text not null,
  folder_name text not null default 'Tests',
  title text not null,
  slug text not null,
  exam_type text,
  duration_minutes integer,
  max_marks real,
  total_questions integer,
  static_json_path text,
  summary_json_path text,
  source_url text,
  config_json jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  scheduled_until timestamptz,
  is_configured boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pass_plans (
  id text primary key,
  name text not null,
  duration_days integer not null,
  price_inr integer not null,
  original_price_inr integer,
  badge text,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists subscriptions (
  id text primary key,
  user_id text not null,
  plan_id text not null,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payment_provider text default 'manual',
  payment_ref text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists payment_orders (
  id text primary key,
  user_id text not null,
  user_email text not null,
  user_name text,
  plan_id text not null,
  plan_name text not null,
  amount_inr integer not null default 0,
  utr text not null,
  status text not null default 'pending',
  payload_json jsonb not null default '{}'::jsonb,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists enrollments (
  id text primary key,
  user_id text not null,
  course_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists attempts (
  id text primary key,
  user_id text not null,
  course_id text not null,
  test_id text not null,
  score real not null default 0,
  max_marks real not null default 0,
  total_questions integer not null default 0,
  attempted_questions integer not null default 0,
  correct_questions integer not null default 0,
  wrong_questions integer not null default 0,
  paper_time_seconds integer not null default 0,
  answers_json jsonb not null default '[]'::jsonb,
  question_times_json jsonb not null default '{}'::jsonb,
  subject_analysis_json jsonb not null default '[]'::jsonb,
  analysis_json jsonb not null default '{}'::jsonb,
  detail_json jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create table if not exists attempt_resumes (
  id text primary key,
  user_id text not null,
  course_id text not null,
  test_id text not null,
  course_title text,
  folder_name text,
  test_name text,
  expires_at timestamptz,
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, test_id)
);

create table if not exists notebooks (
  id text primary key,
  user_id text not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notebook_questions (
  id text primary key,
  notebook_id text,
  user_id text not null,
  course_id text,
  test_id text,
  attempt_id text,
  question_id text not null,
  question_number integer,
  subject text,
  status text,
  user_answer_json jsonb,
  correct_answer_json jsonb,
  marks_awarded real,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists user_blobs (
  user_id text not null,
  blob_key text not null,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(user_id, blob_key)
);

create table if not exists admin_events (
  id text primary key,
  actor_user_id text,
  event_type text not null,
  entity_type text,
  entity_id text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_attempts_user on attempts(user_id, submitted_at desc);
create index if not exists idx_attempts_test on attempts(test_id);
create index if not exists idx_attempt_resumes_user on attempt_resumes(user_id, updated_at desc);
create index if not exists idx_attempt_resumes_test on attempt_resumes(test_id);
create index if not exists idx_payment_orders_status on payment_orders(status, created_at desc);
create index if not exists idx_payment_orders_user on payment_orders(user_id, created_at desc);
alter table tests add column if not exists source_url text;
create index if not exists idx_enrollments_user on enrollments(user_id);
create index if not exists idx_user_blobs_user on user_blobs(user_id);

insert into pass_plans (id, name, duration_days, price_inr, original_price_inr, badge, description, sort_order) values
('daily', 'Daily Pass', 1, 49, 99, 'Trial', 'Best for one serious mock day.', 1),
('monthly', 'Monthly Pass', 30, 299, 499, 'Popular', 'For steady weekly practice.', 2),
('six_month', '6 Month Pass', 180, 999, 1499, 'Value', 'For full syllabus preparation.', 3),
('yearly', 'Yearly Pass', 365, 1499, 2499, 'Max', 'For long-term test access.', 4)
on conflict (id) do update set
  name = excluded.name,
  duration_days = excluded.duration_days,
  price_inr = excluded.price_inr,
  original_price_inr = excluded.original_price_inr,
  badge = excluded.badge,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into users (id, email, password_hash, display_name, role, avatar_initials) values
('acct_admin_rankbooster_com', 'admin@rankbooster.com', 'Admin@123', 'Admin', 'admin', 'AD')
on conflict (email) do update set
  password_hash = excluded.password_hash,
  display_name = excluded.display_name,
  role = excluded.role,
  avatar_initials = excluded.avatar_initials,
  updated_at = now();

insert into app_settings (key, value_json) values
('announcements', '{"banner":{"enabled":false,"text":"","variant":"info"},"homeAnnouncement":{"enabled":false,"title":"","body":"","target":"all","courseId":""},"payments":{"enabled":false,"upiId":"","payeeName":"RankBooster","note":"Scan the QR, complete payment, then enter the UTR/reference ID."},"resumes":{"expiryHours":24},"cleanup":{"noPassInactiveDays":"never","freeCourseInactiveDays":"never"},"maintenance":{"enabled":false,"title":"Maintenance Mode","message":"RankBooster is being updated. Please try again shortly."}}'::jsonb)
on conflict (key) do nothing;
