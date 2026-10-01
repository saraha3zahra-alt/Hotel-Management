-- Fix: database was created from 002 (old expenses tables), so 008 ("create table if not exists") was skipped.
-- Safe to run more than once. Run in Supabase → SQL Editor.

-- 1) expense_categories: add hotel scope, widen columns, per-hotel unique code
alter table expense_categories add column if not exists hotel_id bigint references hotels(hotel_id);
update expense_categories set hotel_id = (select min(hotel_id) from hotels) where hotel_id is null;
alter table expense_categories alter column category_code type varchar(50);
alter table expense_categories alter column category_name type varchar(150);
alter table expense_categories drop constraint if exists expense_categories_category_code_key;
do $$ begin
  if not exists (select 1 from expense_categories where hotel_id is null) then
    alter table expense_categories alter column hotel_id set not null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'uq_expense_categories_hotel_code') then
    alter table expense_categories add constraint uq_expense_categories_hotel_code unique (hotel_id, category_code);
  end if;
end $$;

-- 2) expenses: columns the backend expects
alter table expenses add column if not exists supplier_name   varchar(200);
alter table expenses add column if not exists payment_method  varchar(50);
alter table expenses add column if not exists status          varchar(30) not null default 'POSTED';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_expenses_status') then
    alter table expenses add constraint ck_expenses_status check (status in ('DRAFT','POSTED','VOID'));
  end if;
end $$;
create index if not exists ix_expenses_hotel_date on expenses(hotel_id, expense_date);
create index if not exists ix_expenses_category_date on expenses(expense_category_id, expense_date);
