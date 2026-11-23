-- =====================================================================
-- Accommodation Service database  (PostgreSQL 15+)
-- Database name: campus_mobility_accommodation
-- Student Mobility & Lifestyle Platform
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- needed for the no-overlap rule on allocations

-- Keeps updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- A. ACCOUNTS AND PEOPLE
-- ---------------------------------------------------------------------
CREATE TABLE accommodation_auth_accounts (
  account_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  role            VARCHAR(15) NOT NULL CHECK (role IN ('STUDENT','WARDEN','HOUSING_ADMIN')),
  full_name       VARCHAR(120) NOT NULL,
  account_status  VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
        CHECK (account_status IN ('ACTIVE','SUSPENDED','PENDING')),
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_otp_challenges (
  challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accommodation_auth_accounts(account_id) ON DELETE CASCADE,
  otp_hash     VARCHAR(255) NOT NULL,
  attempts     SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  is_used      BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_account_created ON email_otp_challenges (account_id, created_at DESC);

CREATE TABLE students (
  student_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL UNIQUE REFERENCES accommodation_auth_accounts(account_id),
  enrollment_no VARCHAR(30) NOT NULL UNIQUE,
  gender        VARCHAR(10) NOT NULL CHECK (gender IN ('MALE','FEMALE','OTHER')),
  course        VARCHAR(100),
  year_of_study SMALLINT CHECK (year_of_study BETWEEN 1 AND 6),
  phone         VARCHAR(20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- B. HOSTEL CATALOGUE
-- ---------------------------------------------------------------------
CREATE TABLE hostels (
  hostel_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_code   VARCHAR(20) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  gender_policy VARCHAR(10) NOT NULL CHECK (gender_policy IN ('MALE','FEMALE','MIXED')),
  address       VARCHAR(255),
  latitude      NUMERIC(9,6) CHECK (latitude BETWEEN -90 AND 90),
  longitude     NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
  description   TEXT,
  status        VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- A. ACCOUNTS AND PEOPLE
-- ---------------------------------------------------------------------
CREATE TABLE wardens (
  warden_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL UNIQUE REFERENCES accommodation_auth_accounts(account_id),
  hostel_id     UUID NOT NULL REFERENCES hostels(hostel_id),
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  status        VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- B. HOSTEL CATALOGUE
-- ---------------------------------------------------------------------
CREATE TABLE blocks (
  block_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id  UUID NOT NULL REFERENCES hostels(hostel_id),
  block_code VARCHAR(20) NOT NULL,
  name       VARCHAR(80) NOT NULL,
  floors     SMALLINT NOT NULL DEFAULT 1 CHECK (floors > 0),
  status     VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hostel_id, block_code)
);

CREATE TABLE room_types (
  room_type_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(60) NOT NULL UNIQUE,
  bed_count             SMALLINT NOT NULL CHECK (bed_count > 0),
  has_attached_bathroom BOOLEAN NOT NULL DEFAULT FALSE,
  is_ac                 BOOLEAN NOT NULL DEFAULT FALSE,
  description           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
  room_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id     UUID NOT NULL REFERENCES blocks(block_id),
  room_type_id UUID NOT NULL REFERENCES room_types(room_type_id),
  room_number  VARCHAR(10) NOT NULL,
  floor        SMALLINT NOT NULL CHECK (floor >= 0),
  status       VARCHAR(18) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE','UNDER_MAINTENANCE','CLOSED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (block_id, room_number)
);
CREATE INDEX idx_rooms_type_status ON rooms (room_type_id, status);

CREATE TABLE beds (
  bed_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(room_id),
  bed_label  VARCHAR(10) NOT NULL,
  status     VARCHAR(15) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','OUT_OF_SERVICE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, bed_label)
);

CREATE TABLE amenities (
  amenity_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_type_amenities (
  room_type_id UUID NOT NULL REFERENCES room_types(room_type_id) ON DELETE CASCADE,
  amenity_id   UUID NOT NULL REFERENCES amenities(amenity_id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

-- ---------------------------------------------------------------------
-- C. TERMS, FEES AND BED INVENTORY
-- ---------------------------------------------------------------------
CREATE TABLE academic_terms (
  term_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(60) NOT NULL UNIQUE,
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  applications_open_at  TIMESTAMPTZ NOT NULL,
  applications_close_at TIMESTAMPTZ NOT NULL,
  status                VARCHAR(10) NOT NULL DEFAULT 'UPCOMING'
        CHECK (status IN ('UPCOMING','OPEN','ONGOING','COMPLETED')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date),
  CHECK (applications_close_at > applications_open_at)
);

CREATE TABLE fee_schedules (
  fee_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id        UUID NOT NULL REFERENCES academic_terms(term_id),
  room_type_id   UUID NOT NULL REFERENCES room_types(room_type_id),
  rent_amount    NUMERIC(10,2) NOT NULL CHECK (rent_amount >= 0),
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  currency       CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  created_by     UUID REFERENCES accommodation_auth_accounts(account_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (term_id, room_type_id)
);

CREATE TABLE bed_inventory (
  inventory_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id      UUID NOT NULL REFERENCES hostels(hostel_id),
  room_type_id   UUID NOT NULL REFERENCES room_types(room_type_id),
  term_id        UUID NOT NULL REFERENCES academic_terms(term_id),
  beds_total     SMALLINT NOT NULL CHECK (beds_total >= 0),
  beds_available SMALLINT NOT NULL CHECK (beds_available >= 0),
  beds_held      SMALLINT NOT NULL DEFAULT 0 CHECK (beds_held >= 0),
  beds_allocated SMALLINT NOT NULL DEFAULT 0 CHECK (beds_allocated >= 0),
  version        INTEGER NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hostel_id, room_type_id, term_id),
  CHECK (beds_total = beds_available + beds_held + beds_allocated)
);

-- ---------------------------------------------------------------------
-- D. APPLICATIONS AND ALLOCATION
-- ---------------------------------------------------------------------
CREATE TABLE hostel_applications (
  application_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(student_id),
  term_id         UUID NOT NULL REFERENCES academic_terms(term_id),
  inventory_id    UUID NOT NULL REFERENCES bed_inventory(inventory_id),
  status          VARCHAR(10) NOT NULL DEFAULT 'APPLIED'
        CHECK (status IN ('APPLIED','HELD','ALLOCATED','REJECTED','EXPIRED','FAILED','CANCELLED')),
  hold_expires_at TIMESTAMPTZ,
  status_reason   VARCHAR(255),
  remarks         TEXT,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'HELD' OR hold_expires_at IS NOT NULL)
);
CREATE UNIQUE INDEX uq_application_student_term_live ON hostel_applications (student_id, term_id)
    WHERE status IN ('APPLIED','HELD','ALLOCATED');
CREATE INDEX idx_application_hold_expiry ON hostel_applications (hold_expires_at)
    WHERE status = 'HELD';
CREATE INDEX idx_application_inventory ON hostel_applications (inventory_id, status);

CREATE TABLE allocations (
  allocation_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL UNIQUE REFERENCES hostel_applications(application_id),
  student_id          UUID NOT NULL REFERENCES students(student_id),
  bed_id              UUID NOT NULL REFERENCES beds(bed_id),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  status              VARCHAR(12) NOT NULL DEFAULT 'ALLOCATED'
        CHECK (status IN ('ALLOCATED','CHECKED_IN','CHECKED_OUT','CANCELLED')),
  allotment_pass_code VARCHAR(30) NOT NULL UNIQUE,
  allocated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at         TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date),
  CONSTRAINT alloc_no_bed_overlap EXCLUDE USING GIST (
        bed_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
      WHERE (status IN ('ALLOCATED','CHECKED_IN'))
);
CREATE UNIQUE INDEX uq_alloc_student_live ON allocations (student_id)
    WHERE status IN ('ALLOCATED','CHECKED_IN');
CREATE INDEX idx_alloc_bed ON allocations (bed_id);

CREATE TABLE room_swap_requests (
  swap_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID NOT NULL REFERENCES allocations(allocation_id),
  reason        VARCHAR(255) NOT NULL,
  new_bed_id    UUID REFERENCES beds(bed_id),
  status        VARCHAR(10) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED','APPROVED','REJECTED','COMPLETED','CANCELLED')),
  handled_by    UUID REFERENCES wardens(warden_id),
  handled_at    TIMESTAMPTZ,
  decision_note VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_swap_allocation_status ON room_swap_requests (allocation_id, status);

CREATE TABLE check_ins (
  check_in_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id      UUID NOT NULL UNIQUE REFERENCES allocations(allocation_id),
  warden_id          UUID NOT NULL REFERENCES wardens(warden_id),
  checked_in_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  room_condition     VARCHAR(15) NOT NULL CHECK (room_condition IN ('GOOD','FAIR','NEEDS_REPAIR')),
  condition_notes    TEXT,
  checked_out_at     TIMESTAMPTZ,
  checkout_condition VARCHAR(15) CHECK (checkout_condition IN ('GOOD','FAIR','NEEDS_REPAIR')),
  is_simulated       BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------------------------------------------------------------------
-- E. PAYMENTS
-- ---------------------------------------------------------------------
CREATE TABLE payment_records (
  payment_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        UUID NOT NULL REFERENCES hostel_applications(application_id),
  student_id            UUID NOT NULL REFERENCES students(student_id),
  fee_type              VARCHAR(10) NOT NULL CHECK (fee_type IN ('RENT','DEPOSIT','REFUND')),
  amount                NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency              CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status                VARCHAR(10) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
  transaction_reference VARCHAR(80) UNIQUE,
  failure_reason        VARCHAR(255),
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_payment_application_fee_live ON payment_records (application_id, fee_type)
    WHERE status IN ('PENDING','SUCCESS');
CREATE INDEX idx_payment_student ON payment_records (student_id, created_at DESC);

-- ---------------------------------------------------------------------
-- F. MAINTENANCE
-- ---------------------------------------------------------------------
CREATE TABLE maintenance_tickets (
  ticket_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id              UUID NOT NULL REFERENCES rooms(room_id),
  raised_by_student_id UUID REFERENCES students(student_id),
  raised_by_warden_id  UUID REFERENCES wardens(warden_id),
  category             VARCHAR(12) NOT NULL
        CHECK (category IN ('PLUMBING','ELECTRICAL','FURNITURE','CLEANING','NETWORK','OTHER')),
  priority             VARCHAR(8) NOT NULL DEFAULT 'MEDIUM'
        CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  title                VARCHAR(120) NOT NULL,
  description          TEXT,
  status               VARCHAR(12) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED')),
  assigned_to          VARCHAR(120),
  resolution_notes     TEXT,
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(raised_by_student_id, raised_by_warden_id) = 1)
);
CREATE INDEX idx_ticket_room ON maintenance_tickets (room_id);
CREATE INDEX idx_ticket_status_priority ON maintenance_tickets (status, priority);

-- ---------------------------------------------------------------------
-- G. SYSTEM AND MESSAGING
-- ---------------------------------------------------------------------
CREATE TABLE outbox_events (
  event_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type   VARCHAR(30) NOT NULL,
  aggregate_id     UUID NOT NULL,
  event_type       VARCHAR(80) NOT NULL,
  payload          JSONB NOT NULL,
  correlation_id   UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at     TIMESTAMPTZ,
  publish_attempts SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;

CREATE TABLE processed_events (
  event_id     UUID NOT NULL,
  consumer     VARCHAR(60) NOT NULL,
  event_type   VARCHAR(80) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, consumer)
);

CREATE TABLE audit_logs (
  audit_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id UUID REFERENCES accommodation_auth_accounts(account_id) ON DELETE SET NULL,
  actor_role       VARCHAR(15),
  action           VARCHAR(60) NOT NULL,
  entity_type      VARCHAR(40) NOT NULL,
  entity_id        UUID,
  details          JSONB,
  ip_address       VARCHAR(45),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
      'accommodation_auth_accounts', 'students', 'wardens', 'hostels', 'room_types',
      'rooms', 'academic_terms', 'fee_schedules', 'bed_inventory',
      'hostel_applications', 'allocations', 'room_swap_requests', 'payment_records',
      'maintenance_tickets'
  ]
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
