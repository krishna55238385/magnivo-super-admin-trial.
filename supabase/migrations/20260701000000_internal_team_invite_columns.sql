-- Add invite-token columns to internal_team so the internal-team invite
-- flow has somewhere to store a token/expiry for the accept-invite step.
-- password_hash already exists on this table (nullable) and needs no change.
alter table internal_team
  add column if not exists invite_token uuid unique,
  add column if not exists invite_expires_at timestamptz;

create index if not exists idx_internal_team_invite_token on internal_team(invite_token);
