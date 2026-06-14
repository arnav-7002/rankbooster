-- RankBooster Turso schema
-- Run this in Turso before connecting the production API.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  avatar_initials TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  badge TEXT,
  price_inr INTEGER NOT NULL DEFAULT 0,
  original_price_inr INTEGER,
  accent_color TEXT DEFAULT '#7C3AED',
  text_color TEXT DEFAULT '#A78BFA',
  subjects_json TEXT NOT NULL DEFAULT '[]',
  folders_json TEXT NOT NULL DEFAULT '[]',
  config_json TEXT NOT NULL DEFAULT '{}',
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  exam_type TEXT,
  duration_minutes INTEGER,
  max_marks INTEGER,
  total_questions INTEGER,
  static_json_path TEXT,
  summary_json_path TEXT,
  config_json TEXT NOT NULL DEFAULT '{}',
  scheduled_at TEXT,
  scheduled_until TEXT,
  is_configured INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(course_id, folder_name, slug)
);

CREATE TABLE IF NOT EXISTS pass_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price_inr INTEGER NOT NULL,
  original_price_inr INTEGER,
  badge TEXT,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  payment_provider TEXT DEFAULT 'manual',
  payment_ref TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(plan_id) REFERENCES pass_plans(id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  max_marks REAL NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  attempted_questions INTEGER NOT NULL DEFAULT 0,
  correct_questions INTEGER NOT NULL DEFAULT 0,
  wrong_questions INTEGER NOT NULL DEFAULT 0,
  paper_time_seconds INTEGER NOT NULL DEFAULT 0,
  answers_json TEXT NOT NULL DEFAULT '{}',
  question_times_json TEXT NOT NULL DEFAULT '{}',
  subject_analysis_json TEXT NOT NULL DEFAULT '[]',
  analysis_json TEXT NOT NULL DEFAULT '{}',
  detail_json TEXT NOT NULL DEFAULT '{}',
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notebooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notebook_questions (
  id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  course_id TEXT,
  test_id TEXT,
  attempt_id TEXT,
  question_id TEXT NOT NULL,
  question_number INTEGER,
  subject TEXT,
  status TEXT,
  user_answer_json TEXT,
  correct_answer_json TEXT,
  marks_awarded REAL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS user_blobs (
  user_id TEXT NOT NULL,
  blob_key TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, blob_key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS admin_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_tests_course ON tests(course_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_test ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_blobs_user ON user_blobs(user_id);
CREATE INDEX IF NOT EXISTS idx_notebook_questions_user ON notebook_questions(user_id, created_at DESC);

INSERT OR IGNORE INTO pass_plans (id, name, duration_days, price_inr, original_price_inr, badge, description, sort_order) VALUES
('daily', 'Daily Pass', 1, 49, 99, 'Trial', 'Best for one serious mock day.', 1),
('monthly', 'Monthly Pass', 30, 299, 499, 'Popular', 'For steady weekly practice.', 2),
('six_month', '6 Month Pass', 180, 999, 1499, 'Value', 'For full syllabus preparation.', 3),
('yearly', 'Yearly Pass', 365, 1499, 2499, 'Max', 'For long-term test access.', 4);

