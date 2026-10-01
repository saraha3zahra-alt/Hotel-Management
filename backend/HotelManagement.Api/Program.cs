using HotelManagement.Application.DTOs;
using HotelManagement.Domain.Entities;
using HotelManagement.Infrastructure.Persistence;
using HotelManagement.Infrastructure.Services;
using HotelManagement.Application.Services;
using Microsoft.EntityFrameworkCore;

var builder=WebApplication.CreateBuilder(args);
var cs=builder.Configuration.GetConnectionString("HotelDb") ?? Environment.GetEnvironmentVariable("HOTEL_DB_CONNECTION") ?? throw new InvalidOperationException("Set ConnectionStrings:HotelDb or HOTEL_DB_CONNECTION");
var env = builder.Environment.EnvironmentName;
builder.Services.AddDbContext<HotelDbContext>(o=>o.UseNpgsql(cs));
builder.Services.AddEndpointsApiExplorer(); builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IFinanceService, FinanceService>();
builder.Services.AddCors(o=>o.AddPolicy("web",p=>p.SetIsOriginAllowed(_=>true).AllowAnyHeader().AllowAnyMethod()));
var app=builder.Build(); app.UseSwagger(); app.UseSwaggerUI(); app.UseCors("web");
app.MapControllers();
app.MapGet("/health",()=>Results.Ok(new{status="ok"}));
app.MapGet("/api/hotels",async(HotelDbContext db)=>await db.Hotels.AsNoTracking().OrderBy(x=>x.HotelName).ToListAsync());
app.MapGet("/api/hotels/{hotelId:long}",async(long hotelId,HotelDbContext db)=>{
 var hotel=await db.Hotels.AsNoTracking().FirstOrDefaultAsync(x=>x.HotelId==hotelId);
 return hotel is null ? Results.NotFound() : Results.Ok(hotel);
});
app.MapPost("/api/hotels",async(CreateHotelRequest x,HotelDbContext db)=>{
 var error=ValidateHotel(x.HotelCode,x.HotelName,x.Email,x.CurrencyCode,x.Timezone);
 if(error is not null)return Results.BadRequest(new{message=error});
 var code=x.HotelCode.Trim().ToUpperInvariant();
 if(await db.Hotels.AnyAsync(h=>h.HotelCode==code))return Results.Conflict(new{message="Hotel code already exists."});
 var e=new Hotel{HotelCode=code,HotelName=x.HotelName.Trim(),Address=Clean(x.Address),Phone=Clean(x.Phone),Email=Clean(x.Email),CurrencyCode=x.CurrencyCode.Trim().ToUpperInvariant(),Timezone=x.Timezone.Trim(),IsActive=x.IsActive};
 db.Hotels.Add(e); await db.SaveChangesAsync();
 return Results.Created($"/api/hotels/{e.HotelId}",e);
});
app.MapPut("/api/hotels/{hotelId:long}",async(long hotelId,UpdateHotelRequest x,HotelDbContext db)=>{
 var error=ValidateHotel(x.HotelCode,x.HotelName,x.Email,x.CurrencyCode,x.Timezone);
 if(error is not null)return Results.BadRequest(new{message=error});
 var e=await db.Hotels.FirstOrDefaultAsync(h=>h.HotelId==hotelId);
 if(e is null)return Results.NotFound();
 var code=x.HotelCode.Trim().ToUpperInvariant();
 if(await db.Hotels.AnyAsync(h=>h.HotelId!=hotelId && h.HotelCode==code))return Results.Conflict(new{message="Hotel code already exists."});
 e.HotelCode=code; e.HotelName=x.HotelName.Trim(); e.Address=Clean(x.Address); e.Phone=Clean(x.Phone); e.Email=Clean(x.Email); e.CurrencyCode=x.CurrencyCode.Trim().ToUpperInvariant(); e.Timezone=x.Timezone.Trim(); e.IsActive=x.IsActive;
 await db.SaveChangesAsync(); return Results.Ok(e);
});
app.MapGet("/api/buildings",async(HotelDbContext db)=>await db.Buildings.AsNoTracking().OrderBy(x=>x.BuildingName).ToListAsync());
app.MapPost("/api/buildings",async(CreateBuildingRequest x,HotelDbContext db)=>{var e=new Building{HotelId=x.HotelId,BuildingCode=x.BuildingCode.Trim(),BuildingName=x.BuildingName.Trim(),Description=x.Description};db.Buildings.Add(e);await db.SaveChangesAsync();return Results.Created($"/api/buildings/{e.BuildingId}",e);});
app.MapGet("/api/pricing-locations",async(HotelDbContext db)=>await db.PricingLocations.AsNoTracking().OrderBy(x=>x.LocationName).ToListAsync());
app.MapPost("/api/pricing-locations",async(CreatePricingLocationRequest x,HotelDbContext db)=>{var e=new PricingLocation{LocationCode=x.LocationCode.Trim(),LocationName=x.LocationName.Trim(),Description=x.Description};db.PricingLocations.Add(e);await db.SaveChangesAsync();return Results.Created($"/api/pricing-locations/{e.PricingLocationId}",e);});
app.MapGet("/api/floors",async(long? buildingId,HotelDbContext db)=>await db.Floors.AsNoTracking().Where(x=>!buildingId.HasValue||x.BuildingId==buildingId).OrderBy(x=>x.FloorNumber).ToListAsync());
app.MapPost("/api/floors",async(CreateFloorRequest x,HotelDbContext db)=>{var e=new Floor{BuildingId=x.BuildingId,PricingLocationId=x.PricingLocationId,FloorCode=x.FloorCode.Trim(),FloorName=x.FloorName.Trim(),FloorNumber=x.FloorNumber};db.Floors.Add(e);await db.SaveChangesAsync();return Results.Created($"/api/floors/{e.FloorId}",e);});
app.MapGet("/api/room-types",async(HotelDbContext db)=>await db.RoomTypes.AsNoTracking().OrderBy(x=>x.RoomTypeName).ToListAsync());
app.MapPost("/api/room-types",async(CreateRoomTypeRequest x,HotelDbContext db)=>{if(x.MaxOccupancy<=0||x.MaxAdults<0||x.MaxChildren<0||x.MaxAdults>x.MaxOccupancy||x.MaxChildren>x.MaxOccupancy)return Results.BadRequest("Invalid capacity");var e=new RoomType{RoomTypeCode=x.RoomTypeCode.Trim(),RoomTypeName=x.RoomTypeName.Trim(),MaxOccupancy=x.MaxOccupancy,MaxAdults=x.MaxAdults,MaxChildren=x.MaxChildren,Description=x.Description};db.RoomTypes.Add(e);await db.SaveChangesAsync();return Results.Created($"/api/room-types/{e.RoomTypeId}",e);});
app.MapGet("/api/room-statuses",async(HotelDbContext db)=>await db.RoomOperationalStatuses.AsNoTracking().ToListAsync());
app.MapGet("/api/rooms",async(HotelDbContext db)=>await db.Rooms.AsNoTracking().OrderBy(x=>x.RoomNumber).ToListAsync());
app.MapPost("/api/rooms",async(CreateRoomRequest x,HotelDbContext db)=>{var e=new Room{FloorId=x.FloorId,RoomTypeId=x.RoomTypeId,OperationalStatusId=x.OperationalStatusId,RoomNumber=x.RoomNumber.Trim(),Description=x.Description,Notes=x.Notes};db.Rooms.Add(e);await db.SaveChangesAsync();return Results.Created($"/api/rooms/{e.RoomId}",e);});
app.MapGet("/api/rooms/{roomId:long}/blocks",async(long roomId,HotelDbContext db)=>await db.RoomBlocks.AsNoTracking().Where(x=>x.RoomId==roomId).OrderBy(x=>x.StartDate).ToListAsync());
app.MapPost("/api/rooms/{roomId:long}/blocks",async(long roomId,CreateRoomBlockRequest x,HotelDbContext db)=>{if(x.EndDate<=x.StartDate)return Results.BadRequest("EndDate must be after StartDate");var e=new RoomBlock{RoomId=roomId,BlockReasonId=x.BlockReasonId,StartDate=x.StartDate,EndDate=x.EndDate,Notes=x.Notes};db.RoomBlocks.Add(e);await db.SaveChangesAsync();return Results.Created($"/api/rooms/{roomId}/blocks/{e.RoomBlockId}",e);});
app.MapGet("/api/room-block-reasons",async(HotelDbContext db)=>await db.RoomBlockReasons.AsNoTracking().ToListAsync());
app.MapGet("/api/age-categories",async(long? hotelId,HotelDbContext db)=>await db.AgeCategories.AsNoTracking().Where(x=>!hotelId.HasValue||x.HotelId==hotelId).OrderBy(x=>x.SortOrder).ToListAsync());
app.MapPost("/api/age-categories",async(CreateAgeCategoryRequest x,HotelDbContext db)=>{if(x.MinAge<0||x.MaxAge<x.MinAge)return Results.BadRequest("Invalid age range");var e=new AgeCategory{HotelId=x.HotelId,CategoryCode=x.CategoryCode.Trim(),CategoryName=x.CategoryName.Trim(),MinAge=x.MinAge,MaxAge=x.MaxAge,SortOrder=x.SortOrder};db.AgeCategories.Add(e);await db.SaveChangesAsync();return Results.Created($"/api/age-categories/{e.AgeCategoryId}",e);});

// ========================= PHASE 3: PRICING ENGINE =========================
app.MapGet("/api/pricing-periods",async(long? hotelId,HotelDbContext db)=>
 await db.PricingPeriods.AsNoTracking()
   .Where(x=>!hotelId.HasValue || x.HotelId==hotelId)
   .OrderBy(x=>x.StartDate).ThenByDescending(x=>x.Priority).ToListAsync());

app.MapPost("/api/pricing-periods",async(CreatePricingPeriodRequest x,HotelDbContext db)=>{
 if(x.EndDate<x.StartDate)return Results.BadRequest(new{message="EndDate must be on or after StartDate."});
 if(string.IsNullOrWhiteSpace(x.PeriodCode)||string.IsNullOrWhiteSpace(x.PeriodName))return Results.BadRequest(new{message="PeriodCode and PeriodName are required."});
 if(!await db.Hotels.AnyAsync(h=>h.HotelId==x.HotelId))return Results.BadRequest(new{message="Hotel not found."});
 var code=x.PeriodCode.Trim().ToUpperInvariant();
 if(await db.PricingPeriods.AnyAsync(p=>p.HotelId==x.HotelId && p.PeriodCode==code))return Results.Conflict(new{message="Pricing period code already exists for this hotel."});
 var e=new PricingPeriod{HotelId=x.HotelId,PeriodCode=code,PeriodName=x.PeriodName.Trim(),StartDate=x.StartDate,EndDate=x.EndDate,Priority=x.Priority,IsActive=x.IsActive};
 db.PricingPeriods.Add(e); await db.SaveChangesAsync();
 return Results.Created($"/api/pricing-periods/{e.PricingPeriodId}",e);
});

app.MapGet("/api/room-prices",async(long? roomId,long? pricingPeriodId,HotelDbContext db)=>
 await db.GuestNightPrices.AsNoTracking()
  .Where(x=>(!roomId.HasValue||x.RoomId==roomId) && (!pricingPeriodId.HasValue||x.PricingPeriodId==pricingPeriodId))
  .OrderBy(x=>x.RoomId).ThenBy(x=>x.AgeCategoryId).ToListAsync());

app.MapPost("/api/room-prices",async(SetRoomGuestNightPriceRequest x,HotelDbContext db)=>{
 if(x.PricePerPersonPerNight<0)return Results.BadRequest(new{message="Price cannot be negative."});
 if(string.IsNullOrWhiteSpace(x.CurrencyCode)||x.CurrencyCode.Trim().Length!=3)return Results.BadRequest(new{message="CurrencyCode must be 3 characters."});

 var room=await (from r in db.Rooms
                 join f in db.Floors on r.FloorId equals f.FloorId
                 join b in db.Buildings on f.BuildingId equals b.BuildingId
                 where r.RoomId==x.RoomId
                 select new{Room=r,Floor=f,Building=b}).FirstOrDefaultAsync();
 if(room is null)return Results.BadRequest(new{message="Room not found."});

 var period=await db.PricingPeriods.FirstOrDefaultAsync(p=>p.PricingPeriodId==x.PricingPeriodId && p.IsActive);
 if(period is null)return Results.BadRequest(new{message="Active pricing period not found."});
 if(period.HotelId!=room.Building.HotelId)return Results.BadRequest(new{message="Room and pricing period belong to different hotels."});

 var age=await db.AgeCategories.FirstOrDefaultAsync(a=>a.AgeCategoryId==x.AgeCategoryId && a.HotelId==period.HotelId && a.IsActive);
 if(age is null)return Results.BadRequest(new{message="Active age category not found for this hotel."});

 var e=await db.GuestNightPrices.FirstOrDefaultAsync(p=>p.PricingPeriodId==x.PricingPeriodId && p.RoomId==x.RoomId && p.AgeCategoryId==x.AgeCategoryId);
 if(e is null){
   e=new GuestNightPrice{PricingPeriodId=x.PricingPeriodId,RoomId=x.RoomId,BuildingId=room.Building.BuildingId,PricingLocationId=room.Floor.PricingLocationId,RoomTypeId=room.Room.RoomTypeId,AgeCategoryId=x.AgeCategoryId};
   db.GuestNightPrices.Add(e);
 }
 e.PricePerPersonPerNight=x.PricePerPersonPerNight;
 e.CurrencyCode=x.CurrencyCode.Trim().ToUpperInvariant();
 await db.SaveChangesAsync();
 return Results.Ok(e);
});

app.MapPost("/api/pricing/calculate-room",async(CalculateRoomPriceRequest x,HotelDbContext db)=>{
 if(x.CheckOutDate<=x.CheckInDate)return Results.BadRequest(new{message="CheckOutDate must be after CheckInDate."});
 if(x.Guests is null || x.Guests.Count==0 || x.Guests.Any(g=>g.Age<0 || g.Count<=0))return Results.BadRequest(new{message="At least one valid guest is required."});

 var room=await (from r in db.Rooms
                 join f in db.Floors on r.FloorId equals f.FloorId
                 join b in db.Buildings on f.BuildingId equals b.BuildingId
                 where r.RoomId==x.RoomId && r.IsActive
                 select new{Room=r,Floor=f,Building=b}).FirstOrDefaultAsync();
 if(room is null)return Results.BadRequest(new{message="Active room not found."});

 var categories=await db.AgeCategories.AsNoTracking().Where(a=>a.HotelId==room.Building.HotelId && a.IsActive).OrderBy(a=>a.SortOrder).ToListAsync();
 var nights=new List<object>(); decimal grandTotal=0m;
 for(var stay=x.CheckInDate;stay<x.CheckOutDate;stay=stay.AddDays(1)){
   var period=await db.PricingPeriods.AsNoTracking()
     .Where(p=>p.HotelId==room.Building.HotelId && p.IsActive && p.StartDate<=stay && p.EndDate>=stay)
     .OrderByDescending(p=>p.Priority).ThenByDescending(p=>p.PricingPeriodId).FirstOrDefaultAsync();
   if(period is null)return Results.BadRequest(new{message=$"No pricing period configured for {stay:yyyy-MM-dd}."});

   decimal nightTotal=0m; var guestLines=new List<object>();
   foreach(var g in x.Guests){
     var cat=categories.FirstOrDefault(a=>g.Age>=a.MinAge && (!a.MaxAge.HasValue || g.Age<=a.MaxAge.Value));
     if(cat is null)return Results.BadRequest(new{message=$"No age category configured for age {g.Age}."});
     var price=await db.GuestNightPrices.AsNoTracking().FirstOrDefaultAsync(p=>p.PricingPeriodId==period.PricingPeriodId && p.RoomId==x.RoomId && p.AgeCategoryId==cat.AgeCategoryId);
     if(price is null)return Results.BadRequest(new{message=$"No room price configured for room {x.RoomId}, {cat.CategoryName}, period {period.PeriodName}."});
     var line=price.PricePerPersonPerNight*g.Count; nightTotal+=line;
     guestLines.Add(new{age=g.Age,count=g.Count,ageCategoryId=cat.AgeCategoryId,ageCategory=cat.CategoryName,unitPrice=price.PricePerPersonPerNight,lineTotal=line});
   }
   grandTotal+=nightTotal;
   nights.Add(new{stayDate=stay,pricingPeriodId=period.PricingPeriodId,pricingPeriod=period.PeriodName,nightTotal,guests=guestLines});
 }
 return Results.Ok(new{roomId=x.RoomId,checkInDate=x.CheckInDate,checkOutDate=x.CheckOutDate,numberOfNights=x.CheckOutDate.DayNumber-x.CheckInDate.DayNumber,total=grandTotal,nights});
});



app.Run();

static string? ValidateHotel(string hotelCode,string hotelName,string? email,string currencyCode,string timezone){
 if(string.IsNullOrWhiteSpace(hotelCode))return "HotelCode is required.";
 if(hotelCode.Trim().Length>20)return "HotelCode cannot exceed 20 characters.";
 if(string.IsNullOrWhiteSpace(hotelName))return "HotelName is required.";
 if(hotelName.Trim().Length>150)return "HotelName cannot exceed 150 characters.";
 if(string.IsNullOrWhiteSpace(currencyCode)||currencyCode.Trim().Length!=3)return "CurrencyCode must contain exactly 3 characters, for example EGP.";
 if(string.IsNullOrWhiteSpace(timezone)||timezone.Trim().Length>50)return "Timezone is required and cannot exceed 50 characters.";
 if(!string.IsNullOrWhiteSpace(email) && !System.Net.Mail.MailAddress.TryCreate(email.Trim(),out _))return "Email format is invalid.";
 return null;
}
static string? Clean(string? value)=>string.IsNullOrWhiteSpace(value)?null:value.Trim();
