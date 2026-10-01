namespace HotelManagement.Application.DTOs;
public record CreateHotelRequest(string HotelCode,string HotelName,string? Address,string? Phone,string? Email,string CurrencyCode,string Timezone,bool IsActive = true);
public record UpdateHotelRequest(string HotelCode,string HotelName,string? Address,string? Phone,string? Email,string CurrencyCode,string Timezone,bool IsActive);
public record CreateBuildingRequest(long HotelId,string BuildingCode,string BuildingName,string? Description);
public record CreatePricingLocationRequest(string LocationCode,string LocationName,string? Description);
public record CreateFloorRequest(long BuildingId,long PricingLocationId,string FloorCode,string FloorName,int FloorNumber);
public record CreateRoomTypeRequest(string RoomTypeCode,string RoomTypeName,int MaxOccupancy,int MaxAdults,int MaxChildren,string? Description);
public record CreateRoomRequest(long FloorId,long RoomTypeId,short OperationalStatusId,string RoomNumber,string? Description,string? Notes);
public record CreateRoomBlockRequest(long BlockReasonId,DateOnly StartDate,DateOnly EndDate,string? Notes);
public record CreateAgeCategoryRequest(long HotelId,string CategoryCode,string CategoryName,int MinAge,int? MaxAge,int SortOrder);

public record CreatePricingPeriodRequest(long HotelId,string PeriodCode,string PeriodName,DateOnly StartDate,DateOnly EndDate,int Priority,bool IsActive=true);
public record SetRoomGuestNightPriceRequest(long PricingPeriodId,long RoomId,long AgeCategoryId,decimal PricePerPersonPerNight,string CurrencyCode="EGP");
public record PriceGuestRequest(int Age,int Count=1);
public record CalculateRoomPriceRequest(long RoomId,DateOnly CheckInDate,DateOnly CheckOutDate,List<PriceGuestRequest> Guests);

public record CreatePromotionRequest(long HotelId,string PromotionCode,string PromotionName,string? Description,DateOnly ValidFrom,DateOnly ValidTo,int Priority,bool CanCombine=false,bool IsActive=true);
public record CreatePromotionTierRequest(long PromotionId,int MinNights,int? MaxNights,string DiscountType,decimal DiscountValue);
public record SetPromotionRoomTypesRequest(List<long> RoomTypeIds);
public record SetPromotionAgeCategoriesRequest(List<long> AgeCategoryIds);
public record CalculateRoomDiscountRequest(long RoomId,DateOnly CheckInDate,DateOnly CheckOutDate,List<PriceGuestRequest> Guests);

public record RoomAvailabilityRequest(long HotelId,DateOnly CheckInDate,DateOnly CheckOutDate,int Adults,int Children,long? RoomTypeId=null,long? BuildingId=null,long? PricingLocationId=null);

public record CreateCustomerRequest(string FirstName,string LastName,string? Phone,string? Email,string? NationalId,string? PassportNumber,string? Nationality,string? Notes);
public record ReservationGuestRequest(string FirstName,string LastName,DateOnly DateOfBirth,string? Nationality,string? NationalId,string? PassportNumber,bool IsPrimaryGuest=false);
public record ReservationRoomRequest(long RoomId,List<ReservationGuestRequest> Guests);
public record CreateReservationRequest(long HotelId,CreateCustomerRequest Customer,DateOnly CheckInDate,DateOnly CheckOutDate,List<ReservationRoomRequest> Rooms,string? BookingSource,string? Notes,string CurrencyCode="EGP");

public record CreatePaymentRequest(long ReservationId,decimal Amount,long PaymentMethodId,string? ReferenceNumber,string? Notes,string Status="SUCCESSFUL");
public record CreateRefundRequest(long ReservationId,long? PaymentId,decimal RefundAmount,long RefundReasonId,string? RefundMethod,string? ReferenceNumber);
public record ChangeRefundStatusRequest(string Status);

public record CreateExpenseCategoryRequest(long HotelId,string CategoryCode,string CategoryName);
public record CreateExpenseRequest(long HotelId,long ExpenseCategoryId,DateOnly ExpenseDate,decimal Amount,string? Description,string? SupplierName,string? ReferenceNumber,string? PaymentMethod,string Status="POSTED");
