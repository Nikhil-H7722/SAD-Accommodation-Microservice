# SAD Accommodation Microservice

Student Mobility & Lifestyle Platform — Microservice 2: Hostels and Housing.

This repository contains the backend service and design documentation for the Accommodation Microservice (FastAPI + SQLAlchemy 2 + PostgreSQL).

---

## Repository Structure

```
.
├── accommodation-service/       # Microservice source code
│   ├── alembic/                 # Database migrations (23 tables)
│   ├── app/                     # FastAPI application
│   │   ├── api/                 # Endpoints (auth, booking, admin)
│   │   ├── services/            # Business logic (booking engine, auth, payments, mailer)
│   │   ├── db.py                # Database engine and sessions
│   │   ├── models.py            # SQLAlchemy 2 declarative models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── security.py          # Password hashing (Argon2) & JWT
│   │   └── seed.py              # Initial database seed script
│   ├── sql/                     # PostgreSQL schema DDL and test setup
│   ├── tests/                   # Concurrency, engine, auth, and API test suites
│   ├── docker-compose.yml       # Local PostgreSQL service
│   ├── requirements.txt         # Python dependencies
│   └── README.md                # Service-specific documentation & run guide
└── docs/                        # Architecture & design documentation
    ├── Accommodation_System_Architecture.png
    ├── Accommodation_DB_Schema_Detailed.png
    ├── Accommodation_Booking_Flow.png
    ├── Accommodation_API_and_Booking_Flow.docx
    └── Accommodation_Service_Database_Design.docx
```

---

## Quickstart

### 1. Start Database
```bash
cd accommodation-service
docker compose up -d
```

### 2. Environment & Dependencies
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

### 3. Run Migrations & Seed Data
```bash
alembic upgrade head
python -m app.seed
```

### 4. Run the API
```bash
uvicorn app.main:app --reload
```
API Documentation will be available at: http://localhost:8000/docs

---

## Tests
```bash
docker compose up -d
pytest -v
```
