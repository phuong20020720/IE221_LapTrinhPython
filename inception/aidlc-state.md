# AI-DLC State

- Profile: MVP
- Increment: Accounts, Authentication và Patients
- Current stage: Verification
- Gate status: pending
- Last verified: 2026-09-18

## Scope

Triển khai custom User + JWT cho Employee/Admin, CRUD Employee (Admin), Patient model với chuẩn hóa SĐT, CRUD/search Patients, và SPA auth flow kèm UI quản lý.

## Sources of truth

- `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#12-đăng-nhập-và-phân-quyền`
- `inception/plainning/thiết-kế-database-và-erd.md#4.1-users`
- `inception/plainning/thiết-kế-database-và-erd.md#4.5-patients`
- `inception/architecture/adr/002-authentication.md`
- `inception/architecture/api-contract.md`
- `inception/architecture/security-and-permission-model.md`

## Evidence

- Django check + makemigrations check: passed.
- Backend tests: 24 passed (`accounts`, `patients`, `chatbot`).
- Frontend typecheck, ESLint, Vitest (8) và production build: passed.
- Migrations: `accounts.0002_user_role_constraint`, `patients.0001_initial`.

## Open decisions

- Không

## Next action

Chạy `$medibook-aidlc-verify` hoặc người dùng Acceptance Gate sau khi tự smoke-test login/Patients/Employees trên UI.
