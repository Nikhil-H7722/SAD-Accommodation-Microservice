# Accommodation Microservice — Student Mobility & Lifestyle Platform

Built on the proven Transportation Service blueprint for campus housing, hostel bed allocations, warden inspections, and administrative demand forecasting.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               ACCOMMODATION MICROSERVICE                                │
│                     Student Mobility & Lifestyle Platform (Microservice 2)              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
        │                                  │                                  │
        ▼                                  ▼                                  ▼
   ┌─────────┐                        ┌─────────┐                      ┌──────────────┐
   │ STUDENT │                        │ WARDEN  │                      │ HOUSING_ADMIN│
   └─────────┘                        └─────────┘                      └──────────────┘
        │                                  │                                  │
        └──────────────────────────────────┼──────────────────────────────────┘
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │          Unified Frontend Application        │
                    │   React 18 + TypeScript + Tailwind CSS SPA   │
                    │  Student Portal | Warden Console | Admin     │
                    │         Amounts shown in INR (₹)             │
                    └──────────────────────────────────────────────┘
                                           │  REST + WebSocket (/api/v1/accommodation/*)
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │          FastAPI Microservice Engine         │
                    │  • Bed Allocation Engine (State Machine)     │
                    │  • Embedded AI Occupancy Forecaster          │
                    │  • Embedded AI Room Recommender              │
                    │  • Three-Role Auth & 6-Digit OTP             │
                    │  • INR Payment Gateway Adapter               │
                    │  • Transactional Outbox (RabbitMQ)           │
                    │  • GiST Exclusion Constraint Bed Locks       │
                    └──────────────────────────────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │      PostgreSQL 15+ Relational Database      │
                    │           campus_mobility_accommodation      │
                    │  23 Normalized Tables • Triggers • Views     │
                    └──────────────────────────────────────────────┘
```

---

## Repository Structure

```
.
├── accommodation-service/          # FastAPI Backend Microservice
│   ├── app/                        # Application Source Code
│   │   ├── api/                    # REST API Endpoints (auth, booking, admin)
│   │   ├── services/               # Core Engines (booking, auth, mailer, payments)
│   │   ├── db.py                   # SQLAlchemy 2 Database Connection
│   │   ├── models.py               # ORM Models matching Schema
│   │   ├── schemas.py              # Pydantic Schemas
│   │   ├── security.py             # Argon2 Password Hashing & HS256 JWT
│   │   └── seed.py                 # Initial Database Seed Script
│   ├── sql/                        # Detailed Production SQL Database
│   │   ├── schema.sql              # Complete PostgreSQL DDL (23 tables, triggers, views)
│   │   ├── seed.sql                # Comprehensive University Seed Dataset
│   │   ├── views.sql               # 6 Operational & Analytical SQL Views
│   │   └── init-test-db.sql        # Automated Test Database Initialization
│   ├── tests/                      # Concurrency & Booking Engine Test Suites
│   ├── docker-compose.yml          # PostgreSQL 16 Service Definition
│   ├── requirements.txt            # Python Dependencies
│   └── README.md                   # Backend Service Documentation
│
├── frontend/                       # Unified Frontend Application (React 18 + TS + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── student/            # Student Portal (Booking, Recommender, Pass, Swaps, Tickets)
│   │   │   │   ├── StudentPortal.tsx
│   │   │   │   ├── RoomRecommender.tsx   # Embedded AI Multi-Criteria Room Recommender
│   │   │   │   ├── RoomPass.tsx          # Digital Allotment Pass (QR Code & Printable)
│   │   │   │   └── PaymentModal.tsx      # INR Payment Gateway Simulator
│   │   │   ├── warden/             # Warden Console (Arrivals, Inspections, Swaps, Tickets)
│   │   │   │   └── WardenConsole.tsx
│   │   │   ├── admin/              # Housing Admin Console (Forecaster, Fees, Inventory, Audit)
│   │   │   │   └── AdminConsole.tsx      # Embedded AI Time-Series Occupancy Forecaster
│   │   │   ├── AuthModal.tsx       # 3-Role Login & 2FA OTP Modal
│   │   │   └── Header.tsx          # App Bar with Active Hold Timer & Role Switcher
│   │   ├── context/
│   │   │   └── AppContext.tsx      # State Machine, 30-min Timer, and Store Management
│   │   ├── data/
│   │   │   └── mockData.ts         # Realistic Campus Dataset (Hostels, Rooms, Beds, Accounts)
│   │   └── types/
│   │       └── index.ts            # TypeScript Interfaces
│   ├── package.json
│   └── vite.config.ts
│
└── docs/                           # Architectural & Design Specifications
    ├── Accommodation_System_Architecture.png
    ├── Accommodation_DB_Schema_Detailed.png
    ├── Accommodation_Booking_Flow.png
    ├── Accommodation_API_and_Booking_Flow.docx
    └── Accommodation_Service_Database_Design.docx
```

---

## 1. Detailed SQL Database

The database (`campus_mobility_accommodation`) comprises **23 normalized tables**, custom constraints, automated triggers, and 6 views:

### Key Highlights:
1. **Double-Allocation Prevention**: Physical exclusion constraint on `allocations` using GiST:
   ```sql
   CONSTRAINT alloc_no_bed_overlap EXCLUDE USING GIST (
     bed_id WITH =, 
     daterange(start_date, end_date, '[]') WITH &&
   ) WHERE (status IN ('ALLOCATED', 'CHECKED_IN'));
   ```
2. **Bed Inventory Consistency Constraint**:
   ```sql
   CHECK (beds_total = beds_available + beds_held + beds_allocated)
   ```
3. **Partial Unique Indexes**:
   - `uq_application_student_term_live`: Guarantees one live application per student per term (`APPLIED`, `HELD`, `ALLOCATED`).
   - `uq_alloc_student_live`: Restricts a student to at most one active bed allocation.
   - `uq_payment_application_fee_live`: Prevents double charges for Rent and Deposit.
4. **Operational & Analytical SQL Views**:
   - `v_student_available_beds`: Real-time vacancy catalogue with fees in INR.
   - `v_student_allotment_pass`: Complete boarding pass details with resident, room, bed, and warden metadata.
   - `v_warden_expected_arrivals`: Filtered list of students with allocations waiting for physical check-in.
   - `v_warden_maintenance_queue`: Maintenance queue sorted by urgency rank (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
   - `v_admin_hostel_occupancy`: Real-time hostel-wise bed occupancy percentages.
   - `v_admin_revenue_ledger`: Term-wise collections, pending dues, and deposit refunds.

---

## 2. Unified Frontend Application

### Roles & Modules:
- **Student Portal**:
  - **Hostel Catalogue**: Filter by Gender Policy (`MALE`, `FEMALE`, `MIXED`), AC vs Non-AC, and budget.
  - **Embedded AI Room Recommender**: Ranks rooms matching student habits, privacy needs, and budget with explanation breakdown.
  - **Bed Booking State Machine**: Transitions `APPLIED` ➔ `HELD` (30-min countdown timer) ➔ `ALLOCATED`.
  - **INR Payment Gateway**: Simulates Card, UPI QR, and Netbanking with `tok_ok` and `tok_fail` testing options.
  - **Digital Room Allotment Pass**: Downloadable/printable boarding pass with QR code and barcode.
  - **Room Swap Desk**: Submit requests on medical or academic grounds.
  - **Maintenance Desk**: Log plumbing, electrical, and Wi-Fi faults with priority tracking.
- **Warden Console**:
  - **Arrivals & Check-in Desk**: Inspect room condition (`GOOD`, `FAIR`, `NEEDS_REPAIR`), record inspection notes, and issue room keys.
  - **Room Swap Approvals**: Approve or decline student swap requests.
  - **Hostel Maintenance Queue**: Assign technicians and mark tickets resolved.
  - **Resident Roster**: Search active bed occupants across blocks.
- **Housing Admin Console**:
  - **AI Occupancy Demand Forecaster**: Time-series projection against admissions milestones with capacity surge alerts.
  - **Hostel & Bed Inventory Manager**: Adjust bed pool quotas with database safety validation.
  - **Fee Schedule Configuration**: Set seasonal Rent and Refundable Caution Deposits in INR (₹).
  - **Security Audit Ledger**: Trace all administrative actions and security events.

---

## 3. How to Run

### Backend & Database:
```bash
cd accommodation-service

# 1. Start PostgreSQL
docker compose up -d

# 2. Setup Virtual Environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies & configure env
pip install -r requirements.txt
cp .env.example .env

# 4. Initialize Database
# Direct SQL:
psql postgresql://accommodation:accommodation@localhost:5432/campus_mobility_accommodation -f sql/schema.sql
psql postgresql://accommodation:accommodation@localhost:5432/campus_mobility_accommodation -f sql/seed.sql

# Or via Alembic & Python:
alembic upgrade head
python -m app.seed

# 5. Start API Server
uvicorn app.main:app --reload
# API Docs: http://localhost:8000/docs
```

### Frontend Application:
```bash
cd frontend

# Install dependencies (Node 18+)
npm install

# Start Vite Development Server
npm run dev
# Open in browser: http://localhost:5173

# Or build production bundle
npm run build
```

---

## Default Seed Accounts (Password: `Password123!`)
- **Student**: `student2@example.test` (Rohan Verma - Kaveri Boys Hostel)
- **Student**: `student1@example.test` (Ananya Sharma - Ganga Girls Hostel)
- **Student**: `student5@example.test` (Nikhil Hegde)
- **Warden**: `warden1@example.test` (Dr. Suresh Kumar - Kaveri Boys Hostel)
- **Warden**: `warden2@example.test` (Prof. Sunita Reddy - Ganga Girls Hostel)
- **Housing Admin**: `admin@example.test` (Prof. Arvind Deshmukh)
