using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;
namespace HotelManagement.Api.Controllers;
[ApiController][Route("api/reservations")]
public sealed class ReservationsController(IReservationService service):ControllerBase {
 [HttpPost] public async Task<IActionResult>Create(CreateReservationRequest x)=>Ok(await service.CreateDraftAsync(x));
 [HttpGet("{id:long}")] public async Task<IActionResult>Get(long id)=>Ok(await service.GetAsync(id));
 [HttpPost("{id:long}/confirm")] public async Task<IActionResult>Confirm(long id)=>Ok(await service.ConfirmAsync(id));
 [HttpPost("{id:long}/cancel")] public async Task<IActionResult>Cancel(long id)=>Ok(await service.CancelAsync(id));
}
