using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using HotelManagement.Domain.Entities;
using HotelManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public sealed class DiscountService(HotelDbContext db) : IDiscountService
{
    public async Task<object> GetPromotionsAsync(long? hotelId) =>
        await db.Promotions.AsNoTracking().Where(x=>!hotelId.HasValue || x.HotelId==hotelId)
            .OrderByDescending(x=>x.Priority).ThenBy(x=>x.PromotionName).ToListAsync();

    public async Task<object> CreatePromotionAsync(CreatePromotionRequest x)
    {
        if(x.ValidTo<x.ValidFrom) return new { ok=false,message="ValidTo must be on or after ValidFrom." };
        if(string.IsNullOrWhiteSpace(x.PromotionCode)||string.IsNullOrWhiteSpace(x.PromotionName))
            return new { ok=false,message="PromotionCode and PromotionName are required." };
        if(!await db.Hotels.AnyAsync(h=>h.HotelId==x.HotelId)) return new { ok=false,message="Hotel not found." };
        var code=x.PromotionCode.Trim().ToUpperInvariant();
        if(await db.Promotions.AnyAsync(p=>p.HotelId==x.HotelId&&p.PromotionCode==code))
            return new { ok=false,message="Promotion code already exists." };
        var e=new Promotion{HotelId=x.HotelId,PromotionCode=code,PromotionName=x.PromotionName.Trim(),Description=x.Description?.Trim(),ValidFrom=x.ValidFrom,ValidTo=x.ValidTo,DiscountScope="ROOM",Priority=x.Priority,CanCombine=x.CanCombine,IsActive=x.IsActive};
        db.Promotions.Add(e); await db.SaveChangesAsync();
        return new { ok=true,promotion=e };
    }

    public async Task<object> GetTiersAsync(long? promotionId) =>
        await db.PromotionTiers.AsNoTracking().Where(x=>!promotionId.HasValue||x.PromotionId==promotionId)
            .OrderBy(x=>x.MinNights).ToListAsync();

    public async Task<object> CreateTierAsync(CreatePromotionTierRequest x)
    {
        if(x.MinNights<1 || (x.MaxNights.HasValue&&x.MaxNights<x.MinNights)) return new { ok=false,message="Invalid night range." };
        var type=x.DiscountType.Trim().ToUpperInvariant();
        if(type!="PERCENTAGE"&&type!="FIXED_AMOUNT") return new { ok=false,message="DiscountType must be PERCENTAGE or FIXED_AMOUNT." };
        if(x.DiscountValue<0 || (type=="PERCENTAGE"&&x.DiscountValue>100)) return new { ok=false,message="Invalid discount value." };
        if(!await db.Promotions.AnyAsync(p=>p.PromotionId==x.PromotionId)) return new { ok=false,message="Promotion not found." };
        var overlap=await db.PromotionTiers.AnyAsync(t=>t.PromotionId==x.PromotionId&&t.MinNights<=(x.MaxNights??int.MaxValue)&&(t.MaxNights??int.MaxValue)>=x.MinNights);
        if(overlap) return new { ok=false,message="Night range overlaps an existing tier." };
        var e=new PromotionTier{PromotionId=x.PromotionId,MinNights=x.MinNights,MaxNights=x.MaxNights,DiscountType=type,DiscountValue=x.DiscountValue};
        db.PromotionTiers.Add(e); await db.SaveChangesAsync();
        return new { ok=true,tier=e };
    }

    public async Task<bool> SetRoomTypesAsync(long promotionId,IReadOnlyCollection<long> ids)
    {
        if(!await db.Promotions.AnyAsync(p=>p.PromotionId==promotionId)) return false;
        db.PromotionRoomTypes.RemoveRange(await db.PromotionRoomTypes.Where(a=>a.PromotionId==promotionId).ToListAsync());
        foreach(var id in ids.Distinct()) db.PromotionRoomTypes.Add(new PromotionRoomType{PromotionId=promotionId,RoomTypeId=id});
        await db.SaveChangesAsync(); return true;
    }

    public async Task<bool> SetAgeCategoriesAsync(long promotionId,IReadOnlyCollection<long> ids)
    {
        if(!await db.Promotions.AnyAsync(p=>p.PromotionId==promotionId)) return false;
        db.PromotionAgeCategories.RemoveRange(await db.PromotionAgeCategories.Where(a=>a.PromotionId==promotionId).ToListAsync());
        foreach(var id in ids.Distinct()) db.PromotionAgeCategories.Add(new PromotionAgeCategory{PromotionId=promotionId,AgeCategoryId=id});
        await db.SaveChangesAsync(); return true;
    }

    public async Task<object> CalculateRoomDiscountAsync(CalculateRoomDiscountRequest x)
    {
        if(x.CheckOutDate<=x.CheckInDate) return new { ok=false,message="CheckOutDate must be after CheckInDate." };
        if(x.Guests is null||x.Guests.Count==0||x.Guests.Any(g=>g.Age<0||g.Count<=0)) return new { ok=false,message="At least one valid guest is required." };

        var room=await (from r in db.Rooms join f in db.Floors on r.FloorId equals f.FloorId join b in db.Buildings on f.BuildingId equals b.BuildingId
                        where r.RoomId==x.RoomId&&r.IsActive select new{Room=r,Floor=f,Building=b}).FirstOrDefaultAsync();
        if(room is null) return new { ok=false,message="Active room not found." };

        var categories=await db.AgeCategories.AsNoTracking().Where(a=>a.HotelId==room.Building.HotelId&&a.IsActive).OrderBy(a=>a.SortOrder).ToListAsync();
        decimal gross=0m; var usedAgeIds=new HashSet<long>();

        for(var stay=x.CheckInDate;stay<x.CheckOutDate;stay=stay.AddDays(1))
        {
            var period=await db.PricingPeriods.AsNoTracking().Where(p=>p.HotelId==room.Building.HotelId&&p.IsActive&&p.StartDate<=stay&&p.EndDate>=stay)
                .OrderByDescending(p=>p.Priority).ThenByDescending(p=>p.PricingPeriodId).FirstOrDefaultAsync();
            if(period is null) return new { ok=false,message=$"No pricing period configured for {stay:yyyy-MM-dd}." };

            foreach(var g in x.Guests)
            {
                var cat=categories.FirstOrDefault(a=>g.Age>=a.MinAge&&(!a.MaxAge.HasValue||g.Age<=a.MaxAge.Value));
                if(cat is null) return new { ok=false,message=$"No age category configured for age {g.Age}." };
                usedAgeIds.Add(cat.AgeCategoryId);
                var price=await db.GuestNightPrices.AsNoTracking().FirstOrDefaultAsync(p=>p.PricingPeriodId==period.PricingPeriodId&&p.RoomId==x.RoomId&&p.AgeCategoryId==cat.AgeCategoryId);
                if(price is null) return new { ok=false,message=$"No room price configured for room {x.RoomId}, {cat.CategoryName}, period {period.PeriodName}." };
                gross+=price.PricePerPersonPerNight*g.Count;
            }
        }

        var nights=x.CheckOutDate.DayNumber-x.CheckInDate.DayNumber;
        var candidates=await db.Promotions.AsNoTracking().Where(p=>p.HotelId==room.Building.HotelId&&p.IsActive&&p.DiscountScope=="ROOM"&&p.ValidFrom<=x.CheckInDate&&p.ValidTo>=x.CheckOutDate.AddDays(-1)).ToListAsync();
        var scored=new List<(Promotion P,PromotionTier T,decimal Discount)>();

        foreach(var p in candidates)
        {
            var rt=await db.PromotionRoomTypes.AsNoTracking().Where(a=>a.PromotionId==p.PromotionId).Select(a=>a.RoomTypeId).ToListAsync();
            if(rt.Count>0&&!rt.Contains(room.Room.RoomTypeId)) continue;
            var ages=await db.PromotionAgeCategories.AsNoTracking().Where(a=>a.PromotionId==p.PromotionId).Select(a=>a.AgeCategoryId).ToListAsync();
            if(ages.Count>0&&!usedAgeIds.All(ages.Contains)) continue;
            var tier=await db.PromotionTiers.AsNoTracking().FirstOrDefaultAsync(t=>t.PromotionId==p.PromotionId&&t.MinNights<=nights&&(!t.MaxNights.HasValue||t.MaxNights>=nights));
            if(tier is null) continue;
            var d=tier.DiscountType=="PERCENTAGE"?decimal.Round(gross*tier.DiscountValue/100m,2):tier.DiscountValue;
            scored.Add((p,tier,Math.Min(gross,d)));
        }

        var best=scored.OrderByDescending(s=>s.P.Priority).ThenByDescending(s=>s.Discount).ThenBy(s=>s.P.PromotionId).FirstOrDefault();
        var discount=best.P is null?0m:best.Discount;
        return new { ok=true,roomId=x.RoomId,numberOfNights=nights,grossAmount=gross,appliedPromotionId=best.P?.PromotionId,appliedPromotion=best.P?.PromotionName,appliedPromotionTierId=best.T?.PromotionTierId,discountType=best.T?.DiscountType,discountValue=best.T?.DiscountValue,discountAmount=discount,finalAmount=gross-discount };
    }
}
