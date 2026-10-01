-- Phase 7 — Payments + Refunds
-- Phase 1 already created payment_methods, payments, refund_reasons and refunds.
-- This migration strengthens refund integrity for refunds linked to a specific payment.

create or replace function validate_refund_amount()
returns trigger language plpgsql as $$
declare
  reservation_paid numeric(18,2);
  reservation_refunded numeric(18,2);
  payment_paid numeric(18,2);
  payment_refunded numeric(18,2);
  payment_reservation bigint;
begin
  select coalesce(sum(amount),0)
    into reservation_paid
  from payments
  where reservation_id=new.reservation_id
    and status='SUCCESSFUL';

  select coalesce(sum(refund_amount),0)
    into reservation_refunded
  from refunds
  where reservation_id=new.reservation_id
    and refund_id<>coalesce(new.refund_id,-1)
    and status in('APPROVED','PROCESSED');

  if new.status in('APPROVED','PROCESSED')
     and new.refund_amount > reservation_paid-reservation_refunded then
    raise exception 'Refund exceeds refundable paid amount for reservation';
  end if;

  if new.payment_id is not null then
    select reservation_id,
           case when status='SUCCESSFUL' then amount else 0 end
      into payment_reservation,payment_paid
    from payments
    where payment_id=new.payment_id;

    if payment_reservation is null then
      raise exception 'Payment not found';
    end if;

    if payment_reservation<>new.reservation_id then
      raise exception 'Refund payment does not belong to reservation';
    end if;

    select coalesce(sum(refund_amount),0)
      into payment_refunded
    from refunds
    where payment_id=new.payment_id
      and refund_id<>coalesce(new.refund_id,-1)
      and status in('APPROVED','PROCESSED');

    if new.status in('APPROVED','PROCESSED')
       and new.refund_amount > payment_paid-payment_refunded then
      raise exception 'Refund exceeds refundable amount for selected payment';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_validate_refund on refunds;
create trigger trg_validate_refund
before insert or update of refund_amount,status,reservation_id,payment_id
on refunds
for each row execute function validate_refund_amount();
