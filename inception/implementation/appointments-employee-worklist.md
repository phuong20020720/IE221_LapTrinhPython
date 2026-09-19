# Danh sách lịch hẹn theo công việc nhân viên

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#22-employee`, `#9-quản-lý-lịch-hẹn`
- Architecture: `inception/architecture/api-contract.md#internal-endpoints`, `inception/architecture/security-and-permission-model.md`
- ADR: `ADR-002`, `ADR-005`, `ADR-006`, `ADR-007`

## Acceptance criteria

- [x] Employee và Admin tiếp tục được xem toàn bộ lịch hẹn theo permission hiện có.
- [x] Trang danh sách mặc định hiển thị lịch hôm nay thay vì trộn toàn bộ lịch sử.
- [x] Có phạm vi nhanh Hôm nay, Sắp tới, Chưa phân công, Lịch sử và Tất cả.
- [x] Tìm kiếm, trạng thái, bác sĩ và ngày cụ thể kết hợp được với phạm vi đang chọn.
- [x] Danh sách công việc ưu tiên lịch đang khám, lịch đã xác nhận, buổi sáng rồi buổi chiều.
- [x] API phân trang phía server và trả tổng số kết quả để UI điều hướng.
- [x] Cập nhật/hủy lịch tải lại danh sách hiện hành để bản ghi rời phạm vi khi không còn phù hợp.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Dùng index ngày, trạng thái và bác sĩ hiện có; không thay đổi schema. |
| Backend | `backend/apps/appointments/services.py`, `views.py` | Lọc theo phạm vi công việc, sắp xếp ưu tiên và server-side pagination. |
| Frontend API | `frontend/src/shared/api/appointments.ts` | Kiểu scope, query phân trang và paginated response. |
| Frontend UI | `frontend/src/pages/AppointmentsPage.tsx`, `frontend/src/styles/index.css` | Worklist mặc định hôm nay, quick filters, tổng kết quả và điều hướng trang. |
| Tests | `backend/apps/appointments/tests/test_api.py`, `frontend/src/pages/AppointmentsPage.test.tsx` | Scope, pagination, mặc định hôm nay, chuyển phạm vi và regression thao tác lịch. |

## Evidence

| Command/check | Result |
|---|---|
| `python manage.py test apps.appointments.tests.test_api` | passed — 12 tests |
| `npm test -- src/pages/AppointmentsPage.test.tsx` | passed — 3 tests |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `python manage.py check` | passed |
| `python manage.py makemigrations --check --dry-run` | passed — no changes detected |
| Full backend suite | passed — 62 tests |
| Full frontend suite | passed — 10 files/30 tests |
| `npm run build` | passed — còn cảnh báo chunk > 500 kB không chặn build |
| `docker compose config --quiet` | passed |
| `git diff --check` | passed |

## Open items

- Không có mô hình chi nhánh hoặc phân công Employee theo chuyên khoa trong MVP, vì vậy không triển khai “Lịch của tôi”.
- Browser visual QA bị chặn do kết nối trình duyệt trong môi trường không khả dụng; automated UI tests, typecheck và production build đã đạt.
