using HotelManagement.Application.DTOs;

namespace HotelManagement.Application.Services;

public interface IAvailabilityService
{
    Task<object> SearchAsync(RoomAvailabilityRequest request);
}
