using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class PaymentsController(IPaymentService service) : ControllerBase
{
    [HttpGet("payment-methods")]
    public async Task<IActionResult> PaymentMethods() => Ok(await service.GetMethodsAsync());

    [HttpGet("refund-reasons")]
    public async Task<IActionResult> RefundReasons() => Ok(await service.GetRefundReasonsAsync());

    [HttpGet("reservations/{reservationId:long}/finance")]
    public async Task<IActionResult> Finance(long reservationId) =>
        Ok(await service.GetReservationFinanceAsync(reservationId));

    [HttpPost("payments")]
    public async Task<IActionResult> AddPayment(CreatePaymentRequest request) =>
        Ok(await service.AddPaymentAsync(request));

    [HttpPost("refunds")]
    public async Task<IActionResult> CreateRefund(CreateRefundRequest request) =>
        Ok(await service.CreateRefundAsync(request));

    [HttpPost("refunds/{refundId:long}/status")]
    public async Task<IActionResult> ChangeRefundStatus(long refundId,ChangeRefundStatusRequest request) =>
        Ok(await service.ChangeRefundStatusAsync(refundId,request));
}
