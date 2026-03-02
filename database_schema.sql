-- CIPS Certification Application Process 2025
-- PostgreSQL schema

BEGIN;

CREATE TYPE user_role AS ENUM ('APPLICANT', 'CIPS_OFFICE', 'EDUCATION_REVIEWER', 'EXPERIENCE_REVIEWER');
CREATE TYPE application_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'OFFICE_INITIAL_REVIEW',
  'ASSIGNED_TO_REVIEWERS',
  'EDUCATION_REVIEW_IN_PROGRESS',
  'EXPERIENCE_REVIEW_IN_PROGRESS',
  'OFFICE_FINAL_REVIEW',
  'APPROVED',
  'NOT_APPROVED'
);
CREATE TYPE review_status AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'CONFIRMED_BY_OFFICE');
CREATE TYPE decision_type AS ENUM ('APPROVED', 'NOT_APPROVED');

CREATE TABLE users (
  user_id              BIGSERIAL PRIMARY KEY,
  email                VARCHAR(255) NOT NULL UNIQUE,
  first_name           VARCHAR(120) NOT NULL,
  last_name            VARCHAR(120) NOT NULL,
  role                 user_role NOT NULL,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applicants (
  applicant_id         BIGSERIAL PRIMARY KEY,
  user_id              BIGINT NOT NULL UNIQUE REFERENCES users(user_id),
  membership_number    VARCHAR(50) NOT NULL UNIQUE,
  sso_confirmed        BOOLEAN NOT NULL DEFAULT FALSE,
  authorization_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
  application_id       BIGSERIAL PRIMARY KEY,
  applicant_id         BIGINT NOT NULL REFERENCES applicants(applicant_id),
  application_year     INTEGER NOT NULL,
  status               application_status NOT NULL DEFAULT 'DRAFT',
  submitted_at         TIMESTAMPTZ,
  office_payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  office_requirements_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  final_decision       decision_type,
  final_decision_at    TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(applicant_id, application_year)
);

CREATE TABLE applicant_references (
  reference_id         BIGSERIAL PRIMARY KEY,
  application_id       BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  full_name            VARCHAR(200) NOT NULL,
  company              VARCHAR(200),
  email                VARCHAR(255),
  phone                VARCHAR(50),
  reference_letter_url TEXT,
  office_letter_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE education_submissions (
  education_id         BIGSERIAL PRIMARY KEY,
  application_id       BIGINT NOT NULL UNIQUE REFERENCES applications(application_id) ON DELETE CASCADE,
  education_summary    TEXT NOT NULL,
  transcripts_url      TEXT,
  equivalency_assessment_url TEXT,
  office_transcript_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE experience_submissions (
  experience_id        BIGSERIAL PRIMARY KEY,
  application_id       BIGINT NOT NULL UNIQUE REFERENCES applications(application_id) ON DELETE CASCADE,
  experience_summary   TEXT NOT NULL,
  resume_url           TEXT,
  skills_assessment_pdf_url TEXT,
  office_experience_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  office_resume_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  office_skills_assessment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_assignments (
  assignment_id        BIGSERIAL PRIMARY KEY,
  application_id       BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  review_domain        VARCHAR(20) NOT NULL CHECK (review_domain IN ('EDUCATION', 'EXPERIENCE')),
  reviewer_user_id     BIGINT NOT NULL REFERENCES users(user_id),
  deadline_at          TIMESTAMPTZ,
  status               review_status NOT NULL DEFAULT 'ASSIGNED',
  assigned_by_user_id  BIGINT REFERENCES users(user_id),
  assigned_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id, review_domain, reviewer_user_id)
);

CREATE TABLE education_reviews (
  education_review_id  BIGSERIAL PRIMARY KEY,
  assignment_id        BIGINT NOT NULL UNIQUE REFERENCES review_assignments(assignment_id) ON DELETE CASCADE,
  has_cs_program       BOOLEAN,
  it_college_courses_count INTEGER,
  it_university_courses_count INTEGER,
  it_education_years   NUMERIC(4,1),
  recommended_category VARCHAR(100),
  reviewer_comments    TEXT,
  submitted_at         TIMESTAMPTZ
);

CREATE TABLE experience_reviews (
  experience_review_id BIGSERIAL PRIMARY KEY,
  assignment_id        BIGINT NOT NULL UNIQUE REFERENCES review_assignments(assignment_id) ON DELETE CASCADE,
  reviewer_role_name   VARCHAR(200),
  role_start_date      DATE,
  role_end_date        DATE,
  related_it_roles_years NUMERIC(4,1),
  total_it_years       NUMERIC(4,1),
  sfia_levels_stated   VARCHAR(100),
  assessed_sfia_level  VARCHAR(50),
  years_at_sfia5_or_higher NUMERIC(4,1),
  has_1000_hours_last_12_months BOOLEAN,
  reviewer_comments    TEXT,
  submitted_at         TIMESTAMPTZ
);

CREATE TABLE office_review_confirmations (
  confirmation_id      BIGSERIAL PRIMARY KEY,
  application_id       BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  review_domain        VARCHAR(20) NOT NULL CHECK (review_domain IN ('EDUCATION', 'EXPERIENCE')),
  confirmed_by_user_id BIGINT NOT NULL REFERENCES users(user_id),
  confirmed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes                TEXT
);

CREATE TABLE decision_letters (
  letter_id            BIGSERIAL PRIMARY KEY,
  application_id       BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  decision             decision_type NOT NULL,
  sent_by_user_id      BIGINT REFERENCES users(user_id),
  sent_at              TIMESTAMPTZ,
  letter_url           TEXT,
  notes                TEXT
);

CREATE TABLE application_audit_log (
  log_id               BIGSERIAL PRIMARY KEY,
  application_id       BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  actor_user_id        BIGINT REFERENCES users(user_id),
  action               VARCHAR(120) NOT NULL,
  action_details       JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_review_assignments_domain_status ON review_assignments(review_domain, status);
CREATE INDEX idx_audit_log_application_created ON application_audit_log(application_id, created_at DESC);

COMMIT;
