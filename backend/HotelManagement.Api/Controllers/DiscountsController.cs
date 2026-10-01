using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class DiscountsController(IDiscountService service) : ControllerBase
{
    [HttpGet("promotions")]
    public async Task<IActionResult> Promotions([FromQuery] long? hotelId) => Ok(await service.GetPromotionsAsync(hotelId));

    [HttpPost("promotions")]
    public async Task<IActionResult> CreatePromotion(CreatePromotionRequest request) => Ok(await service.CreatePromotionAsync(request));

    [HttpGet("promotion-tiers")]
    public async Task<IActionResult> Tiers([FromQuery] long? promotionId) => Ok(await service.GetTiersAsync(promotionId));

    [HttpPost("promotion-tiers")]
    public async Task<IActionResult> CreateTier(CreatePromotionTierRequest request) => Ok(await service.CreateTierAsync(request));

    [HttpPut("promotions/{promotionId:long}/room-types")]
    public async Task<IActionResult> RoomTypes(long promotionId,SetPromotionRoomTypesRequest request) =>
        await service.SetRoomTypesAsync(promotionId,request.RoomTypeIds) ? NoContent() : NotFound();

    [HttpPut("promotions/{promotionId:long}/age-categories")]
    public async Task<IActionResult> AgeCategories(long promotionId,SetPromotionAgeCategoriesRequest request) =>
        await service.SetAgeCategoriesAsync(promotionId,request.AgeCategoryIds) ? NoContent() : NotFound();

    [HttpPost("discounts/calculate-room")]
    public async Task<IActionResult> Calculate(CalculateRoomDiscountRequest request) => Ok(await service.CalculateRoomDiscountAsync(request));
}
