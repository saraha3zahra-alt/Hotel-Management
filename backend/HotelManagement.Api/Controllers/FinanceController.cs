using HotelManagement.Application.DTOs;
using HotelManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;
namespace HotelManagement.Api.Controllers;
[ApiController][Route("api/finance")]
public sealed class FinanceController(IFinanceService s):ControllerBase {
 [HttpGet("expense-categories")]public async Task<IActionResult>Cats(long hotelId)=>Ok(await s.GetCategoriesAsync(hotelId));
 [HttpPost("expense-categories")]public async Task<IActionResult>CreateCat(CreateExpenseCategoryRequest x)=>Ok(await s.CreateCategoryAsync(x));
 [HttpGet("expenses")]public async Task<IActionResult>Expenses(long hotelId,DateOnly from,DateOnly to)=>Ok(await s.GetExpensesAsync(hotelId,from,to));
 [HttpPost("expenses")]public async Task<IActionResult>CreateExpense(CreateExpenseRequest x)=>Ok(await s.CreateExpenseAsync(x));
 [HttpPost("expenses/{id:long}/void")]public async Task<IActionResult>Void(long id)=>Ok(await s.VoidExpenseAsync(id));
 [HttpGet("summary")]public async Task<IActionResult>Summary(long hotelId,DateOnly from,DateOnly to)=>Ok(await s.SummaryAsync(hotelId,from,to));
}
