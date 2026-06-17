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

create index if not exists idx_payment_orders_status on payment_orders(status, created_at desc);
create index if not exists idx_payment_orders_user on payment_orders(user_id, created_at desc);

insert into app_settings (key, value_json) values
('announcements', '{"banner":{"enabled":false,"text":"","variant":"info"},"homeAnnouncement":{"enabled":false,"title":"","body":""},"payments":{"enabled":false,"upiId":"","payeeName":"RankBooster","note":"Pay using UPI, then submit the UTR/reference ID for manual approval."}}'::jsonb)
on conflict (key) do update set
  value_json = app_settings.value_json || '{"payments":{"enabled":false,"upiId":"","payeeName":"RankBooster","note":"Pay using UPI, then submit the UTR/reference ID for manual approval."}}'::jsonb,
  updated_at = now();
