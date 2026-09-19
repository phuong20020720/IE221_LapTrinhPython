# Dashboard vận hành Medicare

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#13-dashboard-mvp`
- Architecture: `inception/architecture/api-contract.md#internal-endpoints`, `inception/architecture/security-and-permission-model.md`
- ADR: `ADR-004`, `ADR-005`, `ADR-006`, `ADR-007`

## Acceptance criteria

- [x] Employee/Admin xem được số lịch hôm nay, tổng lịch hoạt động, tổng bệnh nhân và bác sĩ hoạt động từ một API nội bộ.
- [x] Lịch `CANCELLED` không được tính trong các số liệu lịch hoạt động.
- [x] Biểu đồ tuần hiển thị đủ thứ Hai đến thứ Bảy, kể cả ngày không có lịch.
- [x] Người dùng chọn được một ngày trong quá khứ để xem tuần chứa ngày đó.
- [x] Biểu đồ bệnh nhân hiển thị số hồ sơ mới theo tháng trong cửa sổ 6 tháng.
- [x] Người dùng chọn được tháng kết thúc trong quá khứ để xem lại dữ liệu lịch sử.
- [x] Mốc tương lai bị chặn ở UI và được backend validation.
- [x] Dashboard có loading, error/retry và responsive layout.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Dùng `Appointment.appointment_date/status`, `Patient.created_at` và index hiện có; không đổi schema. |
| Backend | `backend/apps/dashboard/services.py`, `serializers.py`, `views.py`, `urls.py` | Tổng hợp số liệu theo timezone, khoảng tuần/tháng và bảo vệ endpoint nội bộ. |
| Frontend API | `frontend/src/shared/api/dashboard.ts` | Typed response và query mốc tuần/tháng. |
| Frontend UI | `frontend/src/pages/AdminDashboardPage.tsx`, `frontend/src/styles/index.css` | Metric cards, biểu đồ cột/đường, bộ chọn thời gian và UI states. |
| Tests | `backend/apps/dashboard/tests/test_api.py`, `frontend/src/pages/AdminDashboardPage.test.tsx` | Permission, phép tổng hợp, lịch sử, render chart, đổi mốc và lỗi tải. |

## Evidence

| Command/check | Result |
|---|---|
| `python manage.py test apps.dashboard.tests.test_api` | passed — 4 tests |
| `npm test -- src/pages/AdminDashboardPage.test.tsx` | passed — 2 tests |
| `python manage.py check` | passed |
| `python manage.py makemigrations --check --dry-run` | passed — no changes detected |
| Full backend suite | passed — 66 tests |
| Full frontend suite | passed — 11 files/32 tests |
| `npm run typecheck && npm run lint && npm run build` | passed — còn cảnh báo chunk > 500 kB không chặn build |
| `docker compose config --quiet` và `git diff --check` | passed |

## Open items

- Browser visual QA bị chặn do kết nối trình duyệt trong môi trường không khả dụng; automated UI tests và production build đã đạt.
