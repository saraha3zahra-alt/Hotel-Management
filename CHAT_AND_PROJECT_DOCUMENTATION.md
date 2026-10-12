# Majestic Hotel Management System (نظام إدارة فنادق ماجيستك)
## Comprehensive Technical Project Documentation & Conversation Archive

**Project Repository**: [saraha3zahra-alt/Hotel-Management](https://github.com/saraha3zahra-alt/Hotel-Management)  
**Live Frontend Application (Vercel)**: [https://majestic-hotel-nu.vercel.app](https://majestic-hotel-nu.vercel.app)  
**Live Backend API & Swagger UI (MonsterASP.NET)**: [https://hotel-management-api.runasp.net/swagger/index.html](https://hotel-management-api.runasp.net/swagger/index.html)  
**n8n AI Agent Chat Webhook**: [https://seera.app.n8n.cloud/webhook/0d87b81b-46b0-4f68-9731-63f454648888/chat](https://seera.app.n8n.cloud/webhook/0d87b81b-46b0-4f68-9731-63f454648888/chat)  
**Date & Version**: October 2026 | Version 2.4.0 (Production Release)

---

## 1. Executive Summary & Project Overview

The **Majestic Hotel Management System** is a full-featured, enterprise-grade hospitality operations platform designed for luxury hotel chains. It integrates property management, multi-building room allocations, multi-tiered dynamic pricing, automated reservation lifecycle management, financial accounting, executive KPI business intelligence, and an AI-driven Arabic customer concierge assistant running 24/7 in the cloud.

### Key Milestones Achieved
1. **Database Schema & Large-Scale Seeding**:
   - Engineered and deployed PostgreSQL data models in Supabase for **3 Buildings**, **75 Rooms**, **530 Customers**, **2,100 Reservations**, guest night pricing, payment ledgers, refunds, and operating expenses.
2. **KPI Analytics & Business Intelligence Engine**:
   - Implemented 5 specialized SQL analytical layers covering RevPAR, ADR, Occupancy Rates, RFM Customer Loyalty, Seasonal Elasticity, and real-time reservation quotes.
3. **Enterprise C# ASP.NET Core .NET 8 Backend API**:
   - Built with Clean Architecture, Entity Framework Core with Npgsql, full OpenAPI/Swagger specification, and CORS cross-origin configuration.
   - Successfully deployed to cloud hosting via **MonsterASP.NET** with dedicated HTTPS/SSL and automated IIS handling.
4. **Modern React 18 / TypeScript Frontend**:
   - Built with Vite, Material-UI (MUI), and Arabic RTL localization with the Cairo typography system.
   - Deployed 24/7 on **Vercel** with continuous deployment (CI/CD) directly from GitHub.
5. **n8n AI Agent Concierge Integration**:
   - Implemented an interactive Arabic chat widget (`ChatbotWidget.tsx`) connected directly to an n8n Cloud LangChain workflow (`Main-Rag -hotel system`) with Supabase vector search and real-time database queries.

---

## 2. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                               USER BROWSER / CLIENT                               |
|        Majestic Hotel Frontend (React 18 + Vite + MUI + Arabic RTL on Vercel)     |
|                       https://majestic-hotel-nu.vercel.app                        |
+------------------------------------+----------------------------------------------+
                                     |
               +---------------------+---------------------+
               | HTTP REST API                             | Webhook POST (chatInput, sessionId)
               v                                           v
+-----------------------------------------+   +-----------------------------------------+
|          BACKEND WEB API (.NET 8)       |   |             n8n AI AGENT RAG            |
|       Hosted on MonsterASP.NET (IIS)    |   |     seera.app.n8n.cloud (LangChain)     |
|   https://hotel-management-api.runasp... |   |     • OpenAI GPT-4o / Chat Model        |
|   • Swagger UI Documentation            |   |     • Postgres Chat Memory              |
|   • EF Core + Npgsql                    |   |     • Vector Embeddings (OpenAI)        |
|   • CORS Preflight Handlers             |   |     • Database Tools (SQL Execution)    |
+--------------------+--------------------+   +--------------------+--------------------+
                     |                                             |
                     +---------------------+-----------------------+
                                           |
                                           v
                         +-----------------------------------+
                         |      SUPABASE POSTGRESQL DB       |
                         |   • 3 Buildings, 75 Rooms         |
                         |   • 530 Customers, 2100 Bookings  |
                         |   • Financial Ledgers & Expenses  |
                         |   • pgvector Vector Knowledgebase |
                         |   • Analytical KPI Views (020-060)|
                         +-----------------------------------+
```

### Component Details
| Component | Technology | Cloud Host | Endpoint / URL |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 18, Vite, TypeScript, MUI | Vercel | `https://majestic-hotel-nu.vercel.app` |
| **Backend REST API** | C# ASP.NET Core .NET 8, EF Core | MonsterASP.NET | `https://hotel-management-api.runasp.net` |
| **API Documentation** | Swagger / OpenAPI 3.0 | MonsterASP.NET | `https://hotel-management-api.runasp.net/swagger/index.html` |
| **Database Engine** | PostgreSQL 15, pgvector | Supabase | Cloud PostgreSQL Cluster |
| **AI Agent & RAG** | n8n Cloud, LangChain, OpenAI | n8n Cloud | `https://seera.app.n8n.cloud/webhook/0d87b81b-46b0-4f68-9731-63f454648888/chat` |
| **Source Control** | Git & GitHub | GitHub | `https://github.com/saraha3zahra-alt/Hotel-Management.git` |

---

## 3. Database Architecture & Seed Implementation

### Database Model Overview
* **Hotels & Physical Layout**:
  - `hotels`: Hotel metadata, currency codes, contact information, timezone settings.
  - `buildings`: 3 discrete properties:
    - المبنى الرئيسي (Main Building)
    - جناح رويال (Royal Wing)
    - بيتش فيو (Beachfront Pavilion)
  - `floors`: Structural floor tiers mapped to pricing locations.
  - `room_types`: Standard Double, Deluxe Sea View, Executive Suite, Royal Panoramic Suite.
  - `rooms`: 75 distinct rooms with status management (`Available`, `Occupied`, `Maintenance`, `Blocked`).
* **Pricing & Periods**:
  - `pricing_periods`: Low Season, Regular Season, High Summer Season, Holiday Peak.
  - `age_categories`: Adults, Teens (12-17), Children (4-11), Infants (0-3).
  - `guest_night_prices`: Granular per-person per-night pricing matrix based on room, age, and season.
* **Customer & Reservation Management**:
  - `customers`: 530 unique customer profiles with national ID, passport, phone, nationality, and VIP tagging.
  - `reservations`: 2,100 reservations across 2024–2026 with full status machine (`Confirmed`, `CheckedIn`, `CheckedOut`, `Cancelled`).
  - `reservation_guests`: Itemized guest registries per stay.
* **Financial Ledgers**:
  - `payments`: Credit card, wire transfer, POS cash transactions.
  - `refunds`: Cancellation and modification reimbursement tracking.
  - `expenses`: Category-based hotel operations costs (Staff Payroll, F&B, Maintenance, Utilities).

### Applied Seed Files in GitHub
* `database/010_assignment_seeds_part1.sql`: Core hotels, buildings, floors, rooms, and initial customer records.
* `database/010_assignment_seeds_part2.sql`: Reservation batch records and itemized guest night pricing.
* `database/010_assignment_seeds_part3.sql`: Payments ledger, refunds, operating expenses, and historical transactions.

---

## 4. KPI Analytics & Business Intelligence Layer

The database was upgraded with specialized analytical views:

### Layer 1: Executive Performance & Profitability (`020_kpi_layer_analytics.sql`)
* **RevPAR (Revenue per Available Room)**: `Total Room Revenue / Total Available Room Nights`
* **ADR (Average Daily Rate)**: `Total Room Revenue / Total Sold Room Nights`
* **Occupancy Rate**: `(Sold Rooms / Total Rooms) * 100`
* **Monthly P&L Statement**: Compares gross booking revenues against operational expenses to generate net profit margins.
* **Building Efficiency**: Revenue contribution and utilization breakdown across the 3 hotel wings.

### Layer 2: Customer & Channel Analytics (`030_kpi_customer_and_channel_analytics.sql`)
* **RFM Customer Segmentation**: Groups customers into Champions, Loyalists, At Risk, and One-Time Visitors based on Recency, Frequency, and Monetary spend.
* **Booking Channel Acquisition**: Compares booking volume, ADR, and net margins across Direct Website, Booking.com, Expedia, and Agoda.
* **Demographics & Geographics**: Spending patterns organized by nationality and age demographics.

### Layer 3: Advanced Predictive & Pricing Elasticity (`040_kpi_advanced_predictive_analytics.sql`)
* **Promotion Campaign ROI**: Analyzes promo code redemptions, discount costs, and incremental revenue.
* **Booking Lead Time Distribution**: Organizes reservations by lead-time windows (Same-day, 1-7 days, 8-30 days, 30+ days).
* **Seasonal Price Elasticity**: Tracks demand sensitivity across seasonal pricing changes.

### Layer 4: Real-Time Quoting & Inventory (`050` & `060_booking_quote_and_reservation_helper.sql`)
* Dynamic SQL stored procedures calculate exact reservation quotes given arbitrary check-in/out dates, room IDs, and guest age configurations, factoring in active discounts and seasonal rules.

---

## 5. Backend API Deployment (MonsterASP.NET & .NET 8)

### Why MonsterASP.NET Was Selected
When deploying the C# ASP.NET Core backend, platforms like Render prompt for credit card verification even for free-tier Docker containers. MonsterASP.NET was chosen because it provides:
* **100% Free Hosting for ASP.NET Core (.NET 8)** without requiring credit card information.
* Native Windows IIS hosting environment with integrated process management.
* Free automatic Let's Encrypt wildcard SSL certificate for `*.runasp.net`.

### Build & Package Workflow
The project was compiled and packaged using the .NET CLI:
```powershell
dotnet publish backend/HotelManagement.Api/HotelManagement.Api.csproj -c Release -o ./publish
Compress-Archive -Path ./publish/* -DestinationPath ./hotel_api_publish.zip -Force
```

### Critical Configuration: `web.config` for IIS
ASP.NET Core on IIS requires a properly configured `web.config` file in the site root (`Home`). To prevent IIS from intercepting cross-origin `OPTIONS` requests from Vercel, the handler was updated:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <remove name="OPTIONSVerbHandler" />
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\HotelManagement.Api.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
    </system.webServer>
  </location>
</configuration>
```

### Database Connection Configuration: `appsettings.json`
Inside the MonsterASP.NET File Manager (`Home`), `appsettings.json` was configured to connect securely to Supabase:
```json
{
  "ConnectionStrings": {
    "HotelDb": "Host=aws-0-eu-central-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.YOUR_PROJECT;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

---

## 6. Frontend Deployment (Vercel)

### Deployment Architecture
* **Framework**: React 18 with Vite.
* **Hosting**: Vercel Serverless Edge Network.
* **Root Directory**: `frontend`
* **Build Command**: `vite build`
* **Output Directory**: `dist`

### Environment Variable Setup
In the Vercel Project Settings (`Settings -> Environment Variables`), the API endpoint was established:
* **Key**: `VITE_API_BASE_URL`
* **Value**: `https://hotel-management-api.runasp.net/api`
* **Target**: Production, Preview, Development

### Authentication & Access
The frontend includes built-in authentication support with instant demo roles:
* **Administrator**: `admin@majestic.com` / `123456`
* **Receptionist**: `reception@majestic.com` / `123456`

---

## 7. n8n AI Agent Chatbot Integration

### Workflow Topology (`Main-Rag -hotel system`)
The n8n automation graph consists of:
1. **Trigger**: `When chat message received` (Hosted Chat Trigger with public webhook URL).
2. **AI Agent Node**: LangChain agent connected to OpenAI GPT-4o.
3. **Chat Memory**: `Postgres Chat Memory` storing conversations by `sessionId`.
4. **Vector Store**: `Supabase Vector Store` with `OpenAI Embeddings` for hotel policies, FAQ, and room catalog.
5. **Database Tools**:
   - `Query Total Summary`: Fetches macro KPIs (Occupancy, Revenue).
   - `Query Room details`: Retrieves real-time room availability and amenities.
   - `Query booking quote and availability`: Computes exact pricing quotes.

### Chatbot Widget Implementation (`ChatbotWidget.tsx`)
The React chat widget floats in the bottom-left corner of the dashboard with:
* **Webhook Endpoint**: `https://seera.app.n8n.cloud/webhook/0d87b81b-46b0-4f68-9731-63f454648888/chat`
* **Persistent Session ID**: Auto-generates a unique `sessionId` stored in `useRef` so n8n memory persists conversation context across turns.
* **Multi-Format Response Parser**: Dynamically handles arrays, JSON objects (`output`, `text`, `response`), and raw strings.
* **Quick-Action Chips**: Instant buttons for "الغرف المتاحة" (Available Rooms) and "حجز عائلي" (Family Booking Quote).

---

## 8. Summary of Troubleshooting & Solutions

| Issue Encountered | Root Cause | Implemented Solution |
| :--- | :--- | :--- |
| **Render Credit Card Prompt** | Render requires credit card authorization even for free Docker instances. | Migrated backend to **MonsterASP.NET**, which provides free ASP.NET Core hosting without credit card entry. |
| **HTTP 500 on MonsterASP Backend** | Missing `web.config` and files initially uploaded inside `wwwroot` instead of `Home`. | Created `web.config` and organized all DLLs directly in `Home`. Set Supabase connection string in `appsettings.json`. |
| **CORS Preflight Failure on Vercel** | IIS `OPTIONSVerbHandler` intercepted cross-origin `OPTIONS` requests before reaching ASP.NET Core. | Added `<remove name="OPTIONSVerbHandler" />` to `web.config`. |
| **White Screen on Vercel Frontend** | Accidental removal of `useAuth` import in `Layout.tsx` during widget insertion. | Restored `import { useAuth } from '../authContext'` and pushed fix (`d168c43`) to GitHub. |
| **Chatbot Message Ingestion in n8n** | n8n Chat Trigger requires a unique `sessionId` in the JSON payload. | Added persistent `sessionIdRef` in `ChatbotWidget.tsx` and pushed update (`21c21ef`). |
| **n8n Webhook Endpoint Update** | Updated n8n cloud domain from `sarahhassan22` to `seera.app.n8n.cloud`. | Updated webhook URL across `ChatbotWidget.tsx`, `ChatbotWidget.jsx`, and `chatbot_widget.html` and pushed commit `6691217`. |

---

## 9. Verification & Live URLs

* **Frontend Dashboard**: [https://majestic-hotel-nu.vercel.app](https://majestic-hotel-nu.vercel.app)
* **Backend Swagger API**: [https://hotel-management-api.runasp.net/swagger/index.html](https://hotel-management-api.runasp.net/swagger/index.html)
* **Backend Health Check**: [https://hotel-management-api.runasp.net/health](https://hotel-management-api.runasp.net/health)
* **n8n Chatbot Webhook**: `https://seera.app.n8n.cloud/webhook/0d87b81b-46b0-4f68-9731-63f454648888/chat`
* **GitHub Repository**: [https://github.com/saraha3zahra-alt/Hotel-Management](https://github.com/saraha3zahra-alt/Hotel-Management)

---
*Documentation compiled and generated for Majestic Hotel Management System.*
