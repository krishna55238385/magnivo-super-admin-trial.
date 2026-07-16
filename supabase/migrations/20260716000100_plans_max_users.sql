alter table plans
  add column if not exists max_users integer;

comment on column plans.max_users is
  'Seat cap for this plan tier. NULL = unlimited (Enterprise).';

update plans set max_users = 3  where name = 'Starter';
update plans set max_users = 10 where name = 'Growth';
update plans set max_users = 25 where name = 'Pro';
-- Enterprise: max_users left NULL (unlimited)
