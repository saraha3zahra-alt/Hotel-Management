using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api/availability")]
public sealed class AvailabilityController(IAvailabilityService service) : ControllerBase
{
    [HttpPost("search")]
    public async Task<IActionResult> Search(RoomAvailabilityRequest request) => Ok(await service.SearchAsync(request));
}
