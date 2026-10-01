using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using HotelManagement.Domain.Entities;
using HotelManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public sealed class PaymentService(HotelDbContext db) : IPaymentService
{
    public async Task<object> GetMethodsAsync() =>
        await db.PaymentMethods.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.MethodName).ToListAsync();

    public async Task<object> GetRefundReasonsAsync() =>
        await db.RefundReasons.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.ReasonName).ToListAsync();

    public async Task<object> GetReservationFinanceAsync(long reservationId)
    {
        var reservation=await db.Reservations.AsNoTracking().SingleOrDefaultAsync(x=>x.ReservationId==reservationId);
        if(reservation is null) return new {ok=false,message="Reservation not found."};

        var payments=await db.Payments.AsNoTracking().Where(x=>x.ReservationId==reservationId)
            .OrderByDescending(x=>x.PaymentDate).ToListAsync();
        var refunds=await db.Refunds.AsNoTracking().Where(x=>x.ReservationId==reservationId)
            .OrderByDescending(x=>x.RefundDate).ToListAsync();

        var paid=payments.Where(x=>x.Status=="SUCCESSFUL").Sum(x=>x.Amount);
        var refunded=refunds.Where(x=>x.Status is "APPROVED" or "PROCESSED").Sum(x=>x.RefundAmount);
        var netPaid=paid-refunded;
        var balance=Math.Max(0,reservation.FinalAmount-netPaid);

        return new {
            ok=true,
            reservationId,
            reservation.ReservationNumber,
            reservation.FinalAmount,
            successfulPayments=paid,
            approvedOrProcessedRefunds=refunded,
            netPaid,
            balanceDue=balance,
            refundableAmount=Math.Max(0,paid-refunded),
            paymentStatus=netPaid<=0 ? "UNPAID" : netPaid<reservation.FinalAmount ? "PARTIALLY_PAID" : "PAID",
            payments,
            refunds
        };
    }

    public async Task<object> AddPaymentAsync(CreatePaymentRequest x)
    {
        if(x.Amount<=0) return new {ok=false,message="Payment amount must be greater than zero."};
        var allowed=new[]{"PENDING","SUCCESSFUL","FAILED","REVERSED"};
        var status=x.Status.Trim().ToUpperInvariant();
        if(!allowed.Contains(status)) return new {ok=false,message="Invalid payment status."};

        var reservation=await db.Reservations.SingleOrDefaultAsync(r=>r.ReservationId==x.ReservationId);
        if(reservation is null) return new {ok=false,message="Reservation not found."};
        if(!await db.PaymentMethods.AnyAsync(m=>m.PaymentMethodId==x.PaymentMethodId&&m.IsActive))
            return new {ok=false,message="Active payment method not found."};

        var e=new Payment{
            ReservationId=x.ReservationId,Amount=x.Amount,PaymentMethodId=x.PaymentMethodId,
            ReferenceNumber=x.ReferenceNumber?.Trim(),Notes=x.Notes?.Trim(),Status=status
        };
        db.Payments.Add(e);
        await db.SaveChangesAsync();
        return new {ok=true,payment=e,finance=await GetReservationFinanceAsync(x.ReservationId)};
    }

    public async Task<object> CreateRefundAsync(CreateRefundRequest x)
    {
        if(x.RefundAmount<=0) return new {ok=false,message="Refund amount must be greater than zero."};
        if(!await db.Reservations.AnyAsync(r=>r.ReservationId==x.ReservationId))
            return new {ok=false,message="Reservation not found."};
        if(!await db.RefundReasons.AnyAsync(r=>r.RefundReasonId==x.RefundReasonId&&r.IsActive))
            return new {ok=false,message="Active refund reason not found."};

        if(x.PaymentId.HasValue) {
            var payment=await db.Payments.AsNoTracking().SingleOrDefaultAsync(p=>p.PaymentId==x.PaymentId);
            if(payment is null || payment.ReservationId!=x.ReservationId)
                return new {ok=false,message="Selected payment does not belong to this reservation."};
        }

        var e=new Refund{
            ReservationId=x.ReservationId,PaymentId=x.PaymentId,RefundAmount=x.RefundAmount,
            RefundReasonId=x.RefundReasonId,RefundMethod=x.RefundMethod?.Trim(),
            ReferenceNumber=x.ReferenceNumber?.Trim(),Status="PENDING_APPROVAL"
        };
        db.Refunds.Add(e);
        await db.SaveChangesAsync();
        return new {ok=true,refund=e};
    }

    public async Task<object> ChangeRefundStatusAsync(long refundId,ChangeRefundStatusRequest x)
    {
        var status=x.Status.Trim().ToUpperInvariant();
        var allowed=new[]{"APPROVED","REJECTED","PROCESSED"};
        if(!allowed.Contains(status)) return new {ok=false,message="Status must be APPROVED, REJECTED or PROCESSED."};

        await using var tx=await db.Database.BeginTransactionAsync();
        try {
            var refund=await db.Refunds.SingleOrDefaultAsync(r=>r.RefundId==refundId);
            if(refund is null) return new {ok=false,message="Refund not found."};

            if(refund.Status=="PROCESSED")
                return new {ok=false,message="A processed refund cannot be changed."};
            if(refund.Status=="REJECTED")
                return new {ok=false,message="A rejected refund cannot be changed."};
            if(status=="PROCESSED" && refund.Status!="APPROVED")
                return new {ok=false,message="Refund must be APPROVED before it can be PROCESSED."};

            refund.Status=status;
            await db.SaveChangesAsync(); // PostgreSQL trigger enforces refundable amount atomically.
            await tx.CommitAsync();
            return new {ok=true,refund,finance=await GetReservationFinanceAsync(refund.ReservationId)};
        }
        catch(Exception ex) {
            await tx.RollbackAsync();
            return new {ok=false,message=ex.InnerException?.Message ?? ex.Message};
        }
    }
}
