# Đặt lịch và quản lý lịch hẹn Admin

> Ghi chú thay thế 2026-09-19: public lookup trong record lịch sử này đã bị loại bỏ theo ADR-010; endpoint hiện phải trả `404`.

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#8-quy-tắc-đặt-lịch`, `#9-quản-lý-lịch-hẹn`, `#10-trạng-thái-lịch-hẹn`, `#11-tra-cứu-lịch-hẹn-công-khai`
- Database: `inception/plainning/thiết-kế-database-và-erd.md#46-appointments`
- Architecture: `inception/architecture/api-contract.md`, `inception/architecture/security-and-permission-model.md`
- ADR: `ADR-002`, `ADR-007`, `ADR-009`

## Acceptance criteria

- [x] Public tạo lịch không cần tài khoản; email bắt buộc, bác sĩ tùy chọn và trạng thái ban đầu luôn là `CONFIRMED`.
- [x] Patient được nhận diện theo số điện thoại; hồ sơ có sẵn được tái sử dụng và đồng bộ họ tên/email không rỗng mới nhất.
- [x] Chuyên khoa/bác sĩ phải hoạt động; bác sĩ nếu chọn phải thuộc đúng chuyên khoa; ngày khám không ở quá khứ.
- [x] Email xác nhận chỉ gửi sau khi transaction commit và local nhận qua Mailpit.
- [x] Public tra cứu bằng mã lịch hoặc số điện thoại và chỉ nhận các trường an toàn.
- [x] Employee/Admin xem, tìm, lọc, xem chi tiết, cập nhật, phân công bác sĩ và hủy lịch.
- [x] State machine chặn chuyển sai thứ tự; `COMPLETED`/`CANCELLED` là trạng thái kết thúc; DELETE là soft-cancel có lý do và người thực hiện.
- [x] Admin UI có loading, empty/error state, lọc, phân trang, dialog chi tiết/chỉnh sửa/hủy và toast kết quả.
- [x] Trang đặt lịch và tra cứu phía khách hàng vẫn giữ placeholder đúng phạm vi yêu cầu.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | `backend/apps/appointments/models.py`, `migrations/0001_initial.py` | Entity, FK, choices, constraint và index |
| Domain | `backend/apps/appointments/services.py`, `emails.py`, `patients/services.py` | Transaction, validation, state machine, Patient reuse và email after-commit |
| API | `serializers.py`, `views.py`, `urls.py`, `config/urls.py` | Public create/lookup và internal list/detail/update/cancel có permission |
| Runtime | `backend/config/settings.py`, `compose.yaml`, `.env.example` | SMTP bằng environment và Mailpit local |
| Frontend | `AppointmentsPage.tsx`, `shared/api/appointments.ts`, router/sidebar/CSS | Typed client và màn hình quản lý lịch hẹn Admin |
| Tests | `backend/apps/appointments/tests/test_api.py`, `AppointmentsPage.test.tsx` | Business rule, permission, privacy, state transition và hành vi UI |

## Evidence

| Command/check | Result |
|---|---|
| `docker compose exec -T backend python manage.py test apps.accounts apps.patients apps.chatbot apps.specialties apps.doctors apps.appointments` | passed; 61 tests trên PostgreSQL |
| `python manage.py check` | passed |
| `python manage.py makemigrations --check --dry-run` | passed; no changes detected |
| `docker compose config --quiet` | passed |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test` | passed; 14 tests |
| `npm run build` | passed; chỉ có cảnh báo chunk > 500 kB |
| API health và Mailpit SMTP smoke test | HTTP 200; Mailpit nhận 1 email |
| `git diff --check` | passed |

## Open items

- Production cần thay Mailpit bằng SMTP/provider chuyển phát email thật.
- UI đặt và tra cứu lịch phía khách hàng thuộc increment tiếp theo.
