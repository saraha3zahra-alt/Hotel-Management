using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using HotelManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public sealed class AvailabilityService(HotelDbContext db) : IAvailabilityService
{
    public async Task<object> SearchAsync(RoomAvailabilityRequest x)
    {
        if (x.CheckOutDate <= x.CheckInDate)
            return new { ok=false, message="CheckOutDate must be after CheckInDate." };
        if (x.Adults < 0 || x.Children < 0 || x.Adults + x.Children <= 0)
            return new { ok=false, message="Guest counts are invalid." };

        var reservedRoomIds =
            from rr in db.ReservationRooms.AsNoTracking()
            join r in db.Reservations.AsNoTracking() on rr.ReservationId equals r.ReservationId
            join s in db.ReservationStatuses.AsNoTracking() on r.StatusId equals s.StatusId
            where s.BlocksInventory
               && rr.CheckInDate < x.CheckOutDate
               && rr.CheckOutDate > x.CheckInDate
            select rr.RoomId;

        var blockedRoomIds =
            db.RoomBlocks.AsNoTracking()
              .Where(b => b.StartDate < x.CheckOutDate && b.EndDate > x.CheckInDate)
              .Select(b => b.RoomId);

        var query =
            from room in db.Rooms.AsNoTracking()
            join floor in db.Floors.AsNoTracking() on room.FloorId equals floor.FloorId
            join building in db.Buildings.AsNoTracking() on floor.BuildingId equals building.BuildingId
            join type in db.RoomTypes.AsNoTracking() on room.RoomTypeId equals type.RoomTypeId
            where building.HotelId == x.HotelId
               && room.IsActive && floor.IsActive && building.IsActive && type.IsActive
               && type.MaxAdults >= x.Adults
               && type.MaxChildren >= x.Children
               && type.MaxOccupancy >= x.Adults + x.Children
               && !reservedRoomIds.Contains(room.RoomId)
               && !blockedRoomIds.Contains(room.RoomId)
               && (!x.RoomTypeId.HasValue || room.RoomTypeId == x.RoomTypeId)
               && (!x.BuildingId.HasValue || building.BuildingId == x.BuildingId)
               && (!x.PricingLocationId.HasValue || floor.PricingLocationId == x.PricingLocationId)
            orderby building.BuildingName, floor.FloorNumber, room.RoomNumber
            select new
            {
                room.RoomId,
                room.RoomNumber,
                room.RoomTypeId,
                type.RoomTypeName,
                type.MaxOccupancy,
                type.MaxAdults,
                type.MaxChildren,
                floor.FloorId,
                floor.FloorName,
                floor.FloorNumber,
                floor.PricingLocationId,
                building.BuildingId,
                building.BuildingName
            };

        var rooms = await query.ToListAsync();
        return new
        {
            ok=true,
            x.HotelId,
            x.CheckInDate,
            x.CheckOutDate,
            numberOfNights=x.CheckOutDate.DayNumber-x.CheckInDate.DayNumber,
            requestedGuests=new { adults=x.Adults, children=x.Children },
            availableRoomsCount=rooms.Count,
            rooms
        };
    }
}
