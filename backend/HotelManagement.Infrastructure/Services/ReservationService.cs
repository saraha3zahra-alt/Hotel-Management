using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using HotelManagement.Domain.Entities;
using HotelManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public sealed class ReservationService(HotelDbContext db) : IReservationService
{
 public async Task<object> CreateDraftAsync(CreateReservationRequest x)
 {
  if(x.CheckOutDate<=x.CheckInDate || x.Rooms.Count==0) return new{ok=false,message="Invalid dates or no rooms selected."};
  if(x.Rooms.Select(r=>r.RoomId).Distinct().Count()!=x.Rooms.Count) return new{ok=false,message="The same room cannot be added twice."};
  await using var tx=await db.Database.BeginTransactionAsync();
  try {
   var pending=await db.ReservationStatuses.SingleAsync(s=>s.StatusCode=="PENDING");
   var customer=new Customer{FirstName=x.Customer.FirstName.Trim(),LastName=x.Customer.LastName.Trim(),Phone=x.Customer.Phone,Email=x.Customer.Email,NationalId=x.Customer.NationalId,PassportNumber=x.Customer.PassportNumber,Nationality=x.Customer.Nationality,Notes=x.Customer.Notes};
   db.Customers.Add(customer); await db.SaveChangesAsync();
   var reservation=new Reservation{HotelId=x.HotelId,CustomerId=customer.CustomerId,StatusId=pending.StatusId,ReservationNumber=$"RSV-{DateTime.UtcNow:yyyyMMddHHmmssfff}",CheckInDate=x.CheckInDate,CheckOutDate=x.CheckOutDate,CurrencyCode=x.CurrencyCode.ToUpperInvariant(),BookingSource=x.BookingSource,Notes=x.Notes};
   db.Reservations.Add(reservation); await db.SaveChangesAsync();

   decimal totalGross=0,totalDiscount=0;
   foreach(var req in x.Rooms) {
    if(req.Guests.Count==0) throw new InvalidOperationException($"Room {req.RoomId} has no guests.");
    var room=await (from r in db.Rooms join f in db.Floors on r.FloorId equals f.FloorId join b in db.Buildings on f.BuildingId equals b.BuildingId join rt in db.RoomTypes on r.RoomTypeId equals rt.RoomTypeId where r.RoomId==req.RoomId&&b.HotelId==x.HotelId&&r.IsActive select new{R=r,F=f,B=b,T=rt}).SingleOrDefaultAsync();
    if(room is null) throw new InvalidOperationException($"Room {req.RoomId} not found.");
    var ages=req.Guests.Select(g=>AgeOn(g.DateOfBirth,x.CheckInDate)).ToList();
    var cats=await db.AgeCategories.Where(a=>a.HotelId==x.HotelId&&a.IsActive).ToListAsync();
    var adultCount=0; var childCount=0;
    foreach(var age in ages) { var c=cats.SingleOrDefault(a=>age>=a.MinAge&&(!a.MaxAge.HasValue||age<=a.MaxAge)); if(c is null) throw new InvalidOperationException($"No age category for age {age}."); if(c.CategoryCode.ToUpper().Contains("ADULT")) adultCount++; else childCount++; }
    if(adultCount>room.T.MaxAdults||childCount>room.T.MaxChildren||req.Guests.Count>room.T.MaxOccupancy) throw new InvalidOperationException($"Capacity exceeded for room {req.RoomId}.");

    decimal gross=0; var snapshots=new List<(ReservationGuest Guest,DateOnly Day,long Period,long Cat,int Age,decimal Price)>();
    var rr=new ReservationRoom{ReservationId=reservation.ReservationId,RoomId=req.RoomId,CheckInDate=x.CheckInDate,CheckOutDate=x.CheckOutDate,AdultsCount=adultCount,ChildrenCount=childCount};
    db.ReservationRooms.Add(rr); await db.SaveChangesAsync();
    foreach(var g in req.Guests) {
     var ge=new ReservationGuest{ReservationRoomId=rr.ReservationRoomId,FirstName=g.FirstName.Trim(),LastName=g.LastName.Trim(),DateOfBirth=g.DateOfBirth,Nationality=g.Nationality,NationalId=g.NationalId,PassportNumber=g.PassportNumber,IsPrimaryGuest=g.IsPrimaryGuest};
     db.ReservationGuests.Add(ge); await db.SaveChangesAsync();
     for(var day=x.CheckInDate;day<x.CheckOutDate;day=day.AddDays(1)) {
      var age=AgeOn(g.DateOfBirth,day); var cat=cats.Single(a=>age>=a.MinAge&&(!a.MaxAge.HasValue||age<=a.MaxAge));
      var period=await db.PricingPeriods.Where(q=>q.HotelId==x.HotelId&&q.IsActive&&q.StartDate<=day&&q.EndDate>=day).OrderByDescending(q=>q.Priority).ThenByDescending(q=>q.PricingPeriodId).FirstOrDefaultAsync() ?? throw new InvalidOperationException($"No pricing period for {day:yyyy-MM-dd}.");
      var price=await db.GuestNightPrices.FirstOrDefaultAsync(q=>q.PricingPeriodId==period.PricingPeriodId&&q.RoomId==req.RoomId&&q.AgeCategoryId==cat.AgeCategoryId) ?? throw new InvalidOperationException($"Missing room price for {day:yyyy-MM-dd}, room {req.RoomId}, {cat.CategoryName}.");
      gross+=price.PricePerPersonPerNight; snapshots.Add((ge,day,period.PricingPeriodId,cat.AgeCategoryId,age,price.PricePerPersonPerNight));
     }
    }

    var nights=x.CheckOutDate.DayNumber-x.CheckInDate.DayNumber;
    var promos=await db.Promotions.Where(q=>q.HotelId==x.HotelId&&q.IsActive&&q.DiscountScope=="ROOM"&&q.ValidFrom<=x.CheckInDate&&q.ValidTo>=x.CheckOutDate.AddDays(-1)).ToListAsync();
    Promotion? bestP=null; PromotionTier? bestT=null; decimal bestD=0;
    foreach(var promo in promos) {
     var targets=await db.PromotionRoomTypes.Where(a=>a.PromotionId==promo.PromotionId).Select(a=>a.RoomTypeId).ToListAsync(); if(targets.Count>0&&!targets.Contains(room.R.RoomTypeId)) continue;
     var tier=await db.PromotionTiers.FirstOrDefaultAsync(q=>q.PromotionId==promo.PromotionId&&q.MinNights<=nights&&(!q.MaxNights.HasValue||q.MaxNights>=nights)); if(tier is null) continue;
     var d=tier.DiscountType=="PERCENTAGE"?decimal.Round(gross*tier.DiscountValue/100m,2):Math.Min(gross,tier.DiscountValue);
     if(bestP is null||promo.Priority>bestP.Priority||(promo.Priority==bestP.Priority&&d>bestD)){bestP=promo;bestT=tier;bestD=d;}
    }
    rr.GrossAmount=gross; rr.DiscountAmount=bestD; rr.FinalAmount=gross-bestD; rr.AppliedPromotionId=bestP?.PromotionId; rr.AppliedPromotionTierId=bestT?.PromotionTierId;
    decimal allocated=0;
    for(int i=0;i<snapshots.Count;i++){var s=snapshots[i]; var d=i==snapshots.Count-1?bestD-allocated:(gross==0?0:decimal.Round(bestD*s.Price/gross,2)); allocated+=d; db.ReservationGuestNightRates.Add(new ReservationGuestNightRate{ReservationGuestId=s.Guest.ReservationGuestId,StayDate=s.Day,PricingPeriodId=s.Period,AgeCategoryId=s.Cat,AgeAtStay=s.Age,OriginalPrice=s.Price,DiscountAmount=d,FinalPrice=s.Price-d,CurrencyCode=x.CurrencyCode.ToUpperInvariant()});}
    totalGross+=gross; totalDiscount+=bestD;
   }
   reservation.GrossAmount=totalGross; reservation.DiscountAmount=totalDiscount; reservation.FinalAmount=totalGross-totalDiscount;
   await db.SaveChangesAsync(); await tx.CommitAsync();
   return new{ok=true,reservation.ReservationId,reservation.ReservationNumber,status="PENDING",reservation.GrossAmount,reservation.DiscountAmount,reservation.FinalAmount};
  } catch(Exception ex){await tx.RollbackAsync(); return new{ok=false,message=ex.Message};}
 }

 public async Task<object> ConfirmAsync(long id)=>await ChangeStatus(id,"CONFIRMED");
 public async Task<object> CancelAsync(long id)=>await ChangeStatus(id,"CANCELLED");
 async Task<object> ChangeStatus(long id,string code){await using var tx=await db.Database.BeginTransactionAsync(); try{var r=await db.Reservations.SingleOrDefaultAsync(x=>x.ReservationId==id); if(r is null)return new{ok=false,message="Reservation not found."}; var s=await db.ReservationStatuses.SingleAsync(x=>x.StatusCode==code); r.StatusId=s.StatusId; await db.SaveChangesAsync(); await tx.CommitAsync(); return new{ok=true,r.ReservationId,r.ReservationNumber,status=code};}catch(Exception ex){await tx.RollbackAsync();return new{ok=false,message=ex.Message};}}
 public async Task<object> GetAsync(long id){var r=await db.Reservations.AsNoTracking().SingleOrDefaultAsync(x=>x.ReservationId==id); if(r is null)return new{ok=false,message="Reservation not found."}; var rooms=await db.ReservationRooms.AsNoTracking().Where(x=>x.ReservationId==id).ToListAsync(); return new{ok=true,reservation=r,rooms};}
 static int AgeOn(DateOnly dob,DateOnly d){var a=d.Year-dob.Year;if(d<dob.AddYears(a))a--;return a;}
}
