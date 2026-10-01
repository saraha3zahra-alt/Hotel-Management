# Phase 2 Backend — Hotel/Room Configuration

Targets .NET 8 + EF Core + PostgreSQL/Supabase. The database already exists from Phase 1; **do not run EF migrations to recreate it**.

## Setup
1. Install .NET 8 SDK.
2. Copy `HotelManagement.Api/appsettings.Development.example.json` to `appsettings.Development.json`.
3. Paste the Supabase PostgreSQL connection string (prefer the pooler/server connection shown by Supabase). Never commit the password.
4. From `backend`: `dotnet restore` then `dotnet run --project HotelManagement.Api`.
5. Open `/swagger`.

## Implemented configuration endpoints
Hotels, Buildings, Pricing Locations, Floors, Room Types, Room Statuses, Rooms, Room Blocks/Reasons, Age Categories.

## Note
This environment did not have the .NET SDK installed, so the generated solution could not be compiled here. Run `dotnet restore/build` locally and send any compiler/runtime error for correction.


## Hotel Configuration API update
Added GET `/api/hotels/{id}`, POST `/api/hotels`, and PUT `/api/hotels/{id}` with basic validation and duplicate hotel-code protection. No migration is required; these endpoints use the existing `hotels` table created in Phase 1.


## Phase 3 — Pricing Engine
Run `database/003_room_level_pricing.sql` once on the existing Supabase database.

New APIs:
- `GET/POST /api/pricing-periods`
- `GET/POST /api/room-prices`
- `POST /api/pricing/calculate-room`

Pricing is now configured for the exact `room_id` + pricing period + age category.
The calculation endpoint prices every stay night independently, so one reservation can cross seasons.
No discount is applied in Phase 3; discounts remain Phase 4.


## Phase 4 — Discount Engine
Phase 1 already contains the promotion tables, so Phase 4 does not recreate them.

New APIs:
- `GET/POST /api/promotions`
- `GET/POST /api/promotion-tiers`
- `PUT /api/promotions/{promotionId}/room-types`
- `PUT /api/promotions/{promotionId}/age-categories`
- `POST /api/discounts/calculate-room`

Rules:
- Discount is calculated per room / future ReservationRoom.
- Tiers are based on number of nights.
- Supports percentage and fixed amount.
- Promotion must cover the full room stay.
- Optional room-type and age-category targeting.
- Highest priority eligible promotion wins; tie -> largest calculated discount.
- Phase 4 applies one promotion only; `can_combine` is retained for a later explicit stacking policy.


## Professionalization + Phase 5
Phase 4 discount logic has been moved out of `Program.cs` into:
- `HotelManagement.Api/Controllers/DiscountsController.cs`
- `HotelManagement.Application/Services/IDiscountService.cs`
- `HotelManagement.Infrastructure/Services/DiscountService.cs`

Phase 5 adds:
- `HotelManagement.Api/Controllers/AvailabilityController.cs`
- `HotelManagement.Application/Services/IAvailabilityService.cs`
- `HotelManagement.Infrastructure/Services/AvailabilityService.cs`

Endpoint:
- `POST /api/availability/search`

Availability excludes:
- overlapping inventory-blocking reservations
- overlapping room blocks
- inactive rooms/floors/buildings/types
- rooms whose configured capacity is too small

No Phase 5 migration is needed because Phase 1 already created the required reservation/block tables, indexes, and database conflict guards.


## Phase 6 — Reservation Workflow
Run `database/006_reservation_activation_guard.sql` once before testing confirmation.

New endpoints:
- `POST /api/reservations` — creates one PENDING reservation with one or many rooms, customer, guests, room-level pricing/discount totals, and immutable guest-night rate snapshots.
- `GET /api/reservations/{id}`
- `POST /api/reservations/{id}/confirm` — changes to CONFIRMED. Database trigger atomically rechecks double-booking and room blocks.
- `POST /api/reservations/{id}/cancel`

Important:
- PENDING does not block inventory by design.
- CONFIRMED and CHECKED_IN do block inventory.
- Confirmation safety is enforced in PostgreSQL, not only in API code.
- A reservation can contain multiple rooms.
- Every room is priced independently.
- Guest age is calculated from date of birth for each stay date.
- `reservation_guest_night_rates` stores the price snapshot used at booking time.


## Phase 7 — Payments + Refunds

Run `database/007_payments_refunds_guards.sql` once in Supabase.

New APIs:
- `GET /api/payment-methods`
- `GET /api/refund-reasons`
- `GET /api/reservations/{reservationId}/finance`
- `POST /api/payments`
- `POST /api/refunds`
- `POST /api/refunds/{refundId}/status`

Finance summary calculates:
- successful payments
- approved/processed refunds
- net paid
- balance due
- refundable amount
- UNPAID / PARTIALLY_PAID / PAID status

Refund workflow:
`PENDING_APPROVAL -> APPROVED -> PROCESSED`
or
`PENDING_APPROVAL -> REJECTED`

Database safety:
- total approved/processed refunds cannot exceed successful payments
- when a refund targets a specific payment, it cannot exceed that payment's remaining refundable amount
- the selected payment must belong to the same reservation


## Phase 8 — Expenses + Finance
Run `database/008_expenses_finance.sql` once.

APIs:
- GET/POST `/api/finance/expense-categories`
- GET/POST `/api/finance/expenses`
- POST `/api/finance/expenses/{id}/void`
- GET `/api/finance/summary?hotelId=1&from=2026-01-01&to=2026-12-31`

Finance summary intentionally separates:
- booking value (gross, discounts, final booked revenue)
- cash collected
- refunds
- operating expenses
- net operating cash

This avoids incorrectly treating bookings and cash receipts as the same accounting event.
