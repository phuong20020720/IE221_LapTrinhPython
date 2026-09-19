# AI-DLC State

- Profile: MVP
- Increment: Appointments, Booking and Lookup
- Current stage: Verification
- Gate status: pending
- Last verified: 2026-09-19

## Scope

`Appointment` model with a UUID booking code, session, status and cancellation
data; a booking service that runs find-or-create patient and appointment
creation in one transaction; a state machine that rejects illegal transitions;
public booking and lookup APIs; and an Employee screen to filter and process
appointments.

## Sources of truth

- `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#8-quy-tắc-đặt-lịch`
- `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#10-trạng-thái-lịch-hẹn`
- `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#11-tra-cứu-lịch-hẹn-công-khai`
- `inception/plainning/thiết-kế-database-và-erd.md#4.6-appointments`
- `inception/architecture/api-contract.md`

## Evidence

- Django check + makemigrations check: passed.
- Migrate from an empty database: passed.
- Backend tests: 103 passed (`accounts`, `patients`, `chatbot`, `appointments`, `doctors`).
- Frontend typecheck, ESLint, Vitest (19) and production build: passed.
- Migrations: `specialties.0001_initial`, `doctors.0001_initial`, `appointments.0001_initial`.

## Open decisions

- `apps/specialties` and `apps/doctors` carry provisional models because the
  `feature/specialties-doctors` branch shipped frontend only. Developer 3
  replaces them with the real ones; `appointments` needs no change as long as
  the ERD shape holds.
- `frontend/src/shared/api/doctors.ts` models a doctor as having many
  specialties, which contradicts the ERD. This has to be settled before the
  merge into `dev`.
- `IN_PROGRESS -> CANCELLED` is allowed, following
  `thiết-kế-database-và-erd.md#8`; MVP spec section 10 does not list it.

## Next action

Request the Acceptance Gate for the Appointments increment, then merge
`feature/appointments` into `dev` once the real specialty and doctor backend
is ready.
