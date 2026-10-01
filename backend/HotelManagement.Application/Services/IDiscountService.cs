using HotelManagement.Application.DTOs;

namespace HotelManagement.Application.Services;

public interface IDiscountService
{
    Task<object> GetPromotionsAsync(long? hotelId);
    Task<object> CreatePromotionAsync(CreatePromotionRequest request);
    Task<object> GetTiersAsync(long? promotionId);
    Task<object> CreateTierAsync(CreatePromotionTierRequest request);
    Task<bool> SetRoomTypesAsync(long promotionId, IReadOnlyCollection<long> roomTypeIds);
    Task<bool> SetAgeCategoriesAsync(long promotionId, IReadOnlyCollection<long> ageCategoryIds);
    Task<object> CalculateRoomDiscountAsync(CalculateRoomDiscountRequest request);
}
