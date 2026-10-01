# Hotel Management — Frontend (React + Vite + MUI)

## Run
1. Start the backend (`dotnet run --launch-profile HotelManagement.Api`).
2. `frontend/.env`  →  `VITE_API_BASE_URL=https://localhost:57777/api`  (or `http://localhost:57778/api`)
3. `npm install` then `npm run dev`  (restart after editing `.env`).

## Screens
- Dashboard: KPIs for the current month (cash in, refunds, expenses, net) + rooms by status.
- Hotel / Rooms / Pricing: read-only lists (lookup names instead of raw IDs).
- Reservations: availability search → select room → guests + customer → per-night price preview → create (Pending) → confirm / cancel. Lookup by reservation ID.
- Payments: load a reservation → balance, payments, refunds; record payment; request / approve / reject / process refunds.
- Expenses: date-range filter, summary, categories, add expense, void expense.
- Customers: needs backend endpoints (not available yet).
- Settings: API URL + health check.

The hotel selector in the top bar drives every page. Business errors returned by the backend as `{ ok:false, message }` are shown as error alerts.
