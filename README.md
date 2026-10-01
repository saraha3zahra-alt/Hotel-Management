# Hotel Management System — Phase 1

Implemented: **Database Tables + Constraints** for PostgreSQL/Supabase.

## Included
- Hotel/building/floor/pricing-location/room configuration
- Room types and capacity
- Room blocks and reasons
- Customers
- Multi-room reservations
- Guests per reservation room
- Age categories with overlap protection
- Pricing periods/seasons
- Price matrix: period + building + pricing location + room type + age category
- Guest/night historical pricing snapshots
- Promotions and non-overlapping stay-length tiers
- Room-level discount linkage
- Payments and refunds
- Expenses
- Roles/permissions/audit structures
- Capacity validation
- Double-booking protection
- Room-block conflict protection
- Refund guard
- Core indexes and lookup seed data

## Run order
1. `database/001_extensions.sql`
2. `database/002_tables_constraints.sql`

Target: a new PostgreSQL/Supabase database.

## Next
Phase 2: Hotel/Room Configuration backend + frontend.


## Phase 2 started
Backend scaffold and Hotel/Room Configuration APIs are under `backend/`.
