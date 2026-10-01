using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using HotelManagement.Domain.Entities;
using HotelManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
namespace HotelManagement.Infrastructure.Services;
public sealed class FinanceService(HotelDbContext db):IFinanceService {
 public async Task<object> GetCategoriesAsync(long h)=>await db.ExpenseCategories.AsNoTracking().Where(x=>x.HotelId==h&&x.IsActive).OrderBy(x=>x.CategoryName).ToListAsync();
 public async Task<object> CreateCategoryAsync(CreateExpenseCategoryRequest x){
  if(!await db.Hotels.AnyAsync(h=>h.HotelId==x.HotelId))return new{ok=false,message="Hotel not found."};
  var code=x.CategoryCode.Trim().ToUpperInvariant(); if(await db.ExpenseCategories.AnyAsync(c=>c.HotelId==x.HotelId&&c.CategoryCode==code))return new{ok=false,message="Category code already exists."};
  var e=new ExpenseCategory{HotelId=x.HotelId,CategoryCode=code,CategoryName=x.CategoryName.Trim()};db.ExpenseCategories.Add(e);await db.SaveChangesAsync();return new{ok=true,category=e};}
 public async Task<object> GetExpensesAsync(long h,DateOnly f,DateOnly to)=>await db.Expenses.AsNoTracking().Where(x=>x.HotelId==h&&x.ExpenseDate>=f&&x.ExpenseDate<=to).OrderByDescending(x=>x.ExpenseDate).ToListAsync();
 public async Task<object> CreateExpenseAsync(CreateExpenseRequest x){
  if(x.Amount<=0)return new{ok=false,message="Amount must be greater than zero."}; var s=x.Status.Trim().ToUpperInvariant();if(s!="DRAFT"&&s!="POSTED")return new{ok=false,message="Status must be DRAFT or POSTED."};
  if(!await db.ExpenseCategories.AnyAsync(c=>c.ExpenseCategoryId==x.ExpenseCategoryId&&c.HotelId==x.HotelId&&c.IsActive))return new{ok=false,message="Expense category not found."};
  var e=new Expense{HotelId=x.HotelId,ExpenseCategoryId=x.ExpenseCategoryId,ExpenseDate=x.ExpenseDate,Amount=x.Amount,Description=x.Description,SupplierName=x.SupplierName,ReferenceNumber=x.ReferenceNumber,PaymentMethod=x.PaymentMethod,Status=s};
  db.Expenses.Add(e);await db.SaveChangesAsync();return new{ok=true,expense=e};}
 public async Task<object> VoidExpenseAsync(long id){var e=await db.Expenses.SingleOrDefaultAsync(x=>x.ExpenseId==id);if(e is null)return new{ok=false,message="Expense not found."};e.Status="VOID";await db.SaveChangesAsync();return new{ok=true,expense=e};}
 public async Task<object> SummaryAsync(long h,DateOnly f,DateOnly to){
  if(to<f)return new{ok=false,message="Invalid date range."};
  var reservations=await db.Reservations.AsNoTracking().Where(r=>r.HotelId==h&&r.CheckInDate<=to&&r.CheckOutDate>f).ToListAsync();
  var ids=reservations.Select(r=>r.ReservationId).ToList();
  var payments=await db.Payments.AsNoTracking().Where(p=>ids.Contains(p.ReservationId)&&p.Status=="SUCCESSFUL"&&DateOnly.FromDateTime(p.PaymentDate.DateTime)>=f&&DateOnly.FromDateTime(p.PaymentDate.DateTime)<=to).ToListAsync();
  var refunds=await db.Refunds.AsNoTracking().Where(r=>ids.Contains(r.ReservationId)&&(r.Status=="APPROVED"||r.Status=="PROCESSED")&&DateOnly.FromDateTime(r.RefundDate.DateTime)>=f&&DateOnly.FromDateTime(r.RefundDate.DateTime)<=to).ToListAsync();
  var expenses=await db.Expenses.AsNoTracking().Where(e=>e.HotelId==h&&e.Status=="POSTED"&&e.ExpenseDate>=f&&e.ExpenseDate<=to).ToListAsync();
  var grossBookings=reservations.Sum(r=>r.GrossAmount);var bookingDiscounts=reservations.Sum(r=>r.DiscountAmount);var bookedRevenue=reservations.Sum(r=>r.FinalAmount);
  var cashIn=payments.Sum(p=>p.Amount);var refundAmount=refunds.Sum(r=>r.RefundAmount);var netCash=cashIn-refundAmount;var operatingExpenses=expenses.Sum(e=>e.Amount);var netOperatingCash=netCash-operatingExpenses;
  var byCategory=await (from e in db.Expenses.AsNoTracking() join c in db.ExpenseCategories.AsNoTracking() on e.ExpenseCategoryId equals c.ExpenseCategoryId where e.HotelId==h&&e.Status=="POSTED"&&e.ExpenseDate>=f&&e.ExpenseDate<=to group e by new{c.ExpenseCategoryId,c.CategoryName} into g orderby g.Sum(x=>x.Amount) descending select new{g.Key.ExpenseCategoryId,g.Key.CategoryName,amount=g.Sum(x=>x.Amount)}).ToListAsync();
  return new{ok=true,hotelId=h,from=f,to,grossBookings,bookingDiscounts,bookedRevenue,cashIn,refunds=refundAmount,netCashCollected=netCash,operatingExpenses,netOperatingCash,expenseBreakdown=byCategory};
 }
}
