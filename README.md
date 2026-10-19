# CIPS Certification Application Process 2025 - Database

This repository contains a PostgreSQL schema for the process shown in the provided flow diagram.

## File
- `database_schema.sql`: Core relational schema for applicants, office checks, review assignments, reviewer outputs, final decisions, and audit logging.

## Main process coverage
1. Applicant profile + application submission.
2. CIPS office intake checks (payment, requirements, references, education docs, experience docs).
3. Assignment of education and experience reviewers.
4. Reviewer-specific assessments (education and experience).
5. Office confirmation and final approval/not-approval outcome.
6. Decision letters/certificates and audit trail.

## Apply schema
```bash
psql "$DATABASE_URL" -f database_schema.sql
```
