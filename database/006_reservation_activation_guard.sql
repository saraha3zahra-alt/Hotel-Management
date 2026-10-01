-- Phase 6 — Reservation workflow safety
-- Required: PENDING does not block inventory. Therefore confirmation must re-check
-- every room atomically before a reservation status becomes inventory-blocking.

create or replace function validate_reservation_activation()
returns trigger language plpgsql as $$
declare new_blocks boolean; old_blocks boolean;
begin
 select blocks_inventory into new_blocks from reservation_statuses where status_id=new.status_id;
 if tg_op='UPDATE' then
   select blocks_inventory into old_blocks from reservation_statuses where status_id=old.status_id;
 else old_blocks:=false;
 end if;

 if coalesce(new_blocks,false) and not coalesce(old_blocks,false) then
   if exists(
     select 1
     from reservation_rooms mine
     join reservation_rooms other_rr on other_rr.room_id=mine.room_id
     join reservations other_r on other_r.reservation_id=other_rr.reservation_id
     join reservation_statuses other_s on other_s.status_id=other_r.status_id
     where mine.reservation_id=new.reservation_id
       and other_r.reservation_id<>new.reservation_id
       and other_s.blocks_inventory
       and daterange(mine.check_in_date,mine.check_out_date,'[)')
           && daterange(other_rr.check_in_date,other_rr.check_out_date,'[)')
   ) then raise exception 'Cannot confirm reservation: one or more rooms are no longer available'; end if;

   if exists(
     select 1 from reservation_rooms mine
     join room_blocks rb on rb.room_id=mine.room_id
     where mine.reservation_id=new.reservation_id
       and daterange(mine.check_in_date,mine.check_out_date,'[)')
           && daterange(rb.start_date,rb.end_date,'[)')
   ) then raise exception 'Cannot confirm reservation: one or more rooms are blocked'; end if;
 end if;
 return new;
end $$;

drop trigger if exists trg_validate_reservation_activation on reservations;
create trigger trg_validate_reservation_activation
before update of status_id on reservations
for each row execute function validate_reservation_activation();
