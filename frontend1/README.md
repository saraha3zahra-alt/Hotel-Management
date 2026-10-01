# Hotel Management Frontend — Phase 8 Baseline

React + TypeScript + MUI frontend for the existing ASP.NET Core 8 Phase 8 backend.

## Run
1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if needed.
2. `npm install`
3. `npm run dev`

Default Vite URL: `http://localhost:5173`

The backend already allows CORS from `http://localhost:5173`.

## Current scope
- Shared application layout/sidebar
- Dashboard shell
- Hotel configuration read screen
- Rooms read screen
- Pricing periods and room-level prices read screen
- Navigation shells for Customers, Reservations, Payments/Refunds, Expenses/Finance, Settings

Analytics and n8n are intentionally not included in this phase.
