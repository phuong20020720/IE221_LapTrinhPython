# Dữ liệu demo Medicare

## Sources

- Requirement: yêu cầu trực tiếp của người dùng ngày 2026-09-19 về bộ dữ liệu demo.
- Reference data: `https://benhviennamsaigon.com/doi-ngu-bac-si/` (chỉ tham khảo cơ cấu chuyên khoa, học vị và kinh nghiệm; không sao chép danh tính).
- Requirement: `inception/plainning/kế-hoạch-dự-án.md#53-admin`
- Requirement: `inception/plainning/kế-hoạch-dự-án.md#54-dashboard-dùng-chung-cho-employee-và-admin`
- Database: `inception/plainning/thiết-kế-database-và-erd.md#42-specialties`
- API contract: `inception/architecture/api-contract.md#quy-ước-requestresponse`
- ADR: N/A — không thay đổi ranh giới kiến trúc; dùng Django management command và media storage hiện có.

## Acceptance criteria

- [x] Có command seed idempotent tạo 10 chuyên khoa, mỗi chuyên khoa đúng 2 bác sĩ.
- [x] Có 100 hồ sơ bệnh nhân và 10 tài khoản Employee hoàn toàn hư cấu.
- [x] Có dữ liệu lịch trên từng ngày của 30 ngày gần nhất, đủ 4 trạng thái và có lịch từ thứ Hai đến thứ Bảy tuần kế tiếp.
- [x] Dashboard cho phép chọn tuần/tháng tương lai và API trả dữ liệu tương ứng.
- [x] Chuyên khoa chỉ còn tên, mô tả và trạng thái; không còn số điện thoại/email ở database, API và UI.
- [x] Có 20 chân dung bác sĩ hư cấu được tạo bằng imagegen và seed vào media storage.
- [x] Chạy lại command không nhân bản dữ liệu do command quản lý.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | `backend/apps/specialties/models.py`, `backend/apps/specialties/migrations/0002_remove_specialty_contact_fields.py` | Bỏ contact khỏi danh mục chuyên khoa |
| Backend | `backend/apps/accounts/management/commands/seed_demo.py` | Seed dữ liệu hư cấu theo mốc ngày chạy và chép ảnh vào media |
| Backend | `backend/apps/dashboard/serializers.py` | Cho phép truy vấn kỳ dashboard tương lai |
| Backend API | `backend/apps/specialties/serializers.py`, `backend/apps/specialties/services.py`, `backend/apps/specialties/admin.py` | Chuẩn hóa contract chuyên khoa dạng danh mục |
| Frontend | `frontend/src/pages/SpecialtiesPage.tsx`, `frontend/src/shared/api/specialties.ts` | Gỡ contact khỏi bảng/form chuyên khoa |
| Frontend | `frontend/src/pages/AdminDashboardPage.tsx` | Gỡ giới hạn `max` ở bộ chọn tuần/tháng |
| Assets | `backend/demo_assets/doctors/doctor-01.webp` … `doctor-20.webp` | Chân dung bác sĩ AI hư cấu 640×640 |
| Tests | `backend/apps/accounts/tests/test_seed_demo.py`, `backend/apps/specialties/tests/test_api.py`, `backend/apps/dashboard/tests/test_api.py`, `frontend/src/pages/AdminCatalogPages.test.tsx` | Idempotence, số lượng, trạng thái, kỳ tương lai và regression contact |
| Docs | `README.md`, planning/database/API contract | Cách chạy seed và contract đã cập nhật |

## Evidence

| Command/check | Result |
|---|---|
| `docker compose exec -T backend python manage.py check` | passed, 0 issues |
| `docker compose exec -T backend python manage.py makemigrations --check --dry-run` | passed, no changes detected |
| `docker compose exec -T backend python manage.py test apps.accounts.tests.test_seed_demo apps.specialties.tests.test_api apps.dashboard.tests.test_api` | passed, 14/14 |
| `docker compose exec -T backend python manage.py test` | passed, 68/68 |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test -- --run` | passed, 36/36 |
| `npm run build` | passed; chỉ còn cảnh báo kích thước bundle không chặn |
| `docker compose exec -T backend python manage.py migrate` | passed; migration `specialties.0002` đã áp dụng |
| `docker compose exec -T backend python manage.py seed_demo` | passed; tạo 10/20/100/10 và 72 lịch do seed quản lý |
| API smoke test với `employee01` | passed; JWT hợp lệ, tuần tương lai có dữ liệu, specialty không có `phone`, ảnh bác sĩ HTTP 200 |

## Verification

- Verdict: `passed`.
- Không phát hiện finding nghiêm trọng trong phạm vi increment.
- Dữ liệu định danh trong seed dùng domain `example.test`, số điện thoại giả lập và chân dung AI; không dùng dữ liệu bệnh nhân hoặc bác sĩ thật.
- Database local đã có dữ liệu từ increment trước nên tổng hiển thị hiện tại lớn hơn bộ seed (12 chuyên khoa, 21 bác sĩ, 101 bệnh nhân). Command chỉ làm mới lịch gắn với 100 bệnh nhân demo và không xóa hồ sơ ngoài bộ seed.

## Open items

- Acceptance Gate chờ người dùng kiểm tra trực quan dashboard, danh mục và ảnh bác sĩ.
