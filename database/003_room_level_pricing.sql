-- Phase 3 - Room-level Pricing Engine
-- Run AFTER 001_extensions.sql and 002_tables_constraints.sql.
-- This keeps the original Phase 1 schema and extends pricing so each ROOM can have its own price.

alter table guest_night_prices
    add column if not exists room_id bigint references rooms(room_id);

-- Existing Phase 1 unique constraint priced by building/location/type.
-- Room-level pricing requires room_id to be part of the business key.
alter table guest_night_prices
    drop constraint if exists guest_night_prices_pricing_period_id_building_id_pricing_loc_key;

-- PostgreSQL may have generated a slightly different constraint name in some environments.
do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'guest_night_prices'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%pricing_period_id%'
      and pg_get_constraintdef(oid) ilike '%building_id%'
      and pg_get_constraintdef(oid) ilike '%pricing_location_id%'
      and pg_get_constraintdef(oid) ilike '%room_type_id%'
      and pg_get_constraintdef(oid) ilike '%age_category_id%'
  loop
    execute format('alter table guest_night_prices drop constraint %I', r.conname);
  end loop;
end $$;

-- For new Phase 3 records room_id is mandatory.
-- NOT VALID lets this script remain safe if old test rows already exist.
alter table guest_night_prices
    drop constraint if exists ck_guest_night_prices_room_required;
alter table guest_night_prices
    add constraint ck_guest_night_prices_room_required
    check (room_id is not null) not valid;

create unique index if not exists ux_guest_night_prices_room_age
    on guest_night_prices(pricing_period_id, room_id, age_category_id)
    where room_id is not null;

create index if not exists ix_guest_night_prices_room_lookup
    on guest_night_prices(room_id, pricing_period_id, age_category_id);

comment on column guest_night_prices.room_id is
'Phase 3: exact room being priced. Each room may have a different per-person-per-night price.';
