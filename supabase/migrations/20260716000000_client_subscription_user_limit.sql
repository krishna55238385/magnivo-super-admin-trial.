alter table client_subscriptions
  add column if not exists user_limit integer;

comment on column client_subscriptions.user_limit is
  'Per-org override for seat count. NULL = inherit max_users from the linked subscription_plans row.';
