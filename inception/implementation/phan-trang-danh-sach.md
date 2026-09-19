# Phân trang các API danh sách

## Sources

- Requirement: yêu cầu trực tiếp của người dùng ngày 2026-09-20.
- Architecture: `inception/architecture/api-contract.md#quy-ước-requestresponse`
- ADR: `inception/architecture/adr/004-modular-monolith.md`

## Acceptance criteria

- [x] Mọi API danh sách trả envelope `{ count, next, previous, results }`.
- [x] Mặc định mỗi trang có 10 bản ghi và hỗ trợ `page`, `page_size` tối đa 100.
- [x] Search, chuyên khoa và trạng thái được lọc trên toàn bộ queryset trước khi phân trang.
- [x] Trang bác sĩ công khai và các bảng Employee, Patient, Doctor, Specialty có điều khiển chuyển trang.
- [x] Các dropdown/catalog cần toàn bộ dữ liệu chủ động yêu cầu `page_size=100` thay vì phụ thuộc mặc định.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Chỉ thay đổi query/response, không đổi schema |
| Backend | `backend/config/pagination.py`, list views/services trong `accounts`, `patients`, `appointments`, `doctors`, `specialties` | Paginator dùng chung và filter phía server |
| Frontend | `frontend/src/shared/api/*`, `frontend/src/shared/ui/PaginationControls.tsx`, các page danh sách | Typed page envelope, page state và điều khiển trước/sau |
| Tests | Backend API tests, frontend page tests | Mặc định 10, trang kế tiếp và contract mới |

## Evidence

| Command/check | Result |
|---|---|
| `python manage.py test apps.accounts apps.patients apps.specialties apps.doctors apps.appointments --keepdb` | passed (58 tests) |
| `python manage.py check` | passed |
| `python manage.py makemigrations --check --dry-run` | passed; no changes |
| `python manage.py test --keepdb` | passed (76 tests) |
| `npm run typecheck && npm run lint && npx vitest run --maxWorkers=1 && npm run build` | passed (38 tests + production build) |

## Open items

- Không

## Verification verdict

- `passed`: contract phân trang, filter phía server, typed client, UI chuyển trang và toàn bộ check/test/build đều đạt; không có finding nghiêm trọng.
