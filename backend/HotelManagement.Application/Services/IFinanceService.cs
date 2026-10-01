using HotelManagement.Application.DTOs;
namespace HotelManagement.Application.Services;
public interface IFinanceService {
 Task<object> GetCategoriesAsync(long hotelId);
 Task<object> CreateCategoryAsync(CreateExpenseCategoryRequest x);
 Task<object> GetExpensesAsync(long hotelId,DateOnly from,DateOnly to);
 Task<object> CreateExpenseAsync(CreateExpenseRequest x);
 Task<object> VoidExpenseAsync(long id);
 Task<object> SummaryAsync(long hotelId,DateOnly from,DateOnly to);
}
