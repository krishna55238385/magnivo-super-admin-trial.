-- Super Admin platform tables
-- All scoped at the platform level (no organization_id — these are Magnivo-internal)

-- Internal team members (Magnivo staff with super admin access)
create table if not exists super_admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'viewer', -- super_admin | admin | support | billing | engineer | viewer
  department text,
  permissions jsonb not null default '{}',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscription plans
create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- Starter | Growth | Pro | Enterprise
  price_monthly integer not null, -- in cents
  token_limit bigint not null,
  max_users integer,
  features jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Client subscriptions (links organizations to plans)
create table if not exists client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  plan_id uuid references subscription_plans(id),
  plan_name text not null,
  status text not null default 'trial', -- trial | active | suspended | cancelled
  mrr_cents integer not null default 0,
  token_limit bigint,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  payment_status text not null default 'pending', -- paid | overdue | failed | trial
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoices
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  organization_id uuid references organizations(id) on delete set null,
  plan_name text,
  amount_cents integer not null,
  currency text not null default 'USD',
  status text not null default 'pending', -- pending | paid | overdue | failed | void
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- Token usage tracking (per org, per day)
create table if not exists token_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  date date not null default current_date,
  model text not null, -- gpt-4o | gpt-3.5-turbo | gemini-pro
  feature text not null, -- gtm_pipeline | email_draft | lead_scoring | etc.
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  total_tokens bigint not null default 0,
  estimated_cost_usd numeric(10,4) not null default 0,
  created_at timestamptz not null default now(),
  unique(organization_id, date, model, feature)
);

-- Support tickets
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique, -- TKT-XXX
  organization_id uuid references organizations(id) on delete set null,
  subject text not null,
  description text,
  priority text not null default 'medium', -- urgent | high | medium | low
  status text not null default 'open', -- open | in_progress | waiting | resolved | closed
  category text not null default 'General', -- Bug | Billing | Integration | Account | Onboarding | Feature Request
  assigned_to uuid references super_admin_users(id) on delete set null,
  reporter_email text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Support ticket messages
create table if not exists support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references support_tickets(id) on delete cascade,
  sender_type text not null, -- client | staff | system
  sender_name text,
  content text not null,
  created_at timestamptz not null default now()
);

-- Platform audit log (super admin actions only)
create table if not exists platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references super_admin_users(id) on delete set null,
  actor_email text,
  actor_role text,
  action text not null, -- e.g. client.suspended, invoice.issued, team.member_invited
  target_type text, -- client | billing | support | team | system | usage
  target_id text,
  target_label text,
  details text,
  ip_address text,
  severity text not null default 'low', -- low | medium | high
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Onboarding tracker
create table if not exists client_onboarding (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  assigned_to uuid references super_admin_users(id) on delete set null,
  status text not null default 'in_progress', -- in_progress | completed | stalled
  steps jsonb not null default '[]', -- [{key, label, done, ts}]
  notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_client_subscriptions_org on client_subscriptions(organization_id);
create index if not exists idx_invoices_org on invoices(organization_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_token_usage_org_date on token_usage_logs(organization_id, date);
create index if not exists idx_support_tickets_org on support_tickets(organization_id);
create index if not exists idx_support_tickets_status on support_tickets(status);
create index if not exists idx_platform_audit_logs_created on platform_audit_logs(created_at desc);
create index if not exists idx_platform_audit_logs_action on platform_audit_logs(action);

-- Seed subscription plans
insert into subscription_plans (name, price_monthly, token_limit, max_users, features) values
  ('Starter', 49000, 10000000, 3, '{"engage":true,"dialer":false,"gtm":false,"workflows":false,"ai_search":false,"support":"email"}'),
  ('Growth', 120000, 30000000, 10, '{"engage":true,"dialer":false,"gtm":true,"workflows":true,"ai_search":false,"support":"chat"}'),
  ('Pro', 180000, 60000000, 25, '{"engage":true,"dialer":true,"gtm":true,"workflows":true,"ai_search":true,"support":"priority"}'),
  ('Enterprise', 420000, 100000000, null, '{"engage":true,"dialer":true,"gtm":true,"workflows":true,"ai_search":true,"support":"dedicated_csm"}')
on conflict (name) do nothing;
