using HotelManagement.Application.DTOs;

namespace HotelManagement.Application.Services;

public interface IPaymentService
{
    Task<object> GetMethodsAsync();
    Task<object> GetRefundReasonsAsync();
    Task<object> GetReservationFinanceAsync(long reservationId);
    Task<object> AddPaymentAsync(CreatePaymentRequest request);
    Task<object> CreateRefundAsync(CreateRefundRequest request);
    Task<object> ChangeRefundStatusAsync(long refundId, ChangeRefundStatusRequest request);
}
