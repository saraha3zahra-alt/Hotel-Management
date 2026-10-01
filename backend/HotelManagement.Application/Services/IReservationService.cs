using HotelManagement.Application.DTOs;
namespace HotelManagement.Application.Services;
public interface IReservationService {
 Task<object> CreateDraftAsync(CreateReservationRequest request);
 Task<object> GetAsync(long reservationId);
 Task<object> ConfirmAsync(long reservationId);
 Task<object> CancelAsync(long reservationId);
}
