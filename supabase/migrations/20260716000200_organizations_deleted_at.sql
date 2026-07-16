alter table organizations
  add column if not exists deleted_at timestamptz;

comment on column organizations.deleted_at is
  'Soft-delete marker. NULL = active. Non-null = archived by super admin; excluded from client lists but still directly accessible by id for audit/record-keeping.';
