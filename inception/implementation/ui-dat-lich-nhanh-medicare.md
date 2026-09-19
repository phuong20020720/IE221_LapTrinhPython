# Đặt lịch nhanh Medicare

> Ghi chú thay thế 2026-09-19: CTA tra cứu sau đặt lịch đã được thay bằng `Đặt lịch khác` theo ADR-010.

## Sources

- Requirement: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#10-trang-đặt-lịch`
- Business rules: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#8-quy-tắc-đặt-lịch`
- API contract: `inception/architecture/api-contract.md#public-endpoints`
- ADR: `ADR-005`, `ADR-006`, `ADR-009`

## Acceptance criteria

- [x] Route `/booking` hiển thị form đặt lịch một trang trong layout Medicare.
- [x] Form yêu cầu chuyên khoa, ngày, buổi, lý do, họ tên, số điện thoại và email; bác sĩ là tùy chọn.
- [x] Danh sách bác sĩ được lọc theo chuyên khoa đang chọn.
- [x] `doctor_id` hợp lệ trên URL tự chọn bác sĩ và chuyên khoa tương ứng.
- [x] `doctor_id` không hợp lệ hiển thị cảnh báo và cho phép khách chọn lại.
- [x] Client chặn ngày quá khứ và các trường bắt buộc trước khi gọi API.
- [x] Lỗi field từ backend được hiển thị gần trường liên quan; lỗi tổng quát nằm trong trang.
- [x] Nút submit có loading state và chống gửi lặp.
- [x] Thành công hiển thị booking code, chuyên khoa, bác sĩ, ngày, buổi khám và nhắc kiểm tra email.
- [x] Màn hình thành công có sao chép mã, tra cứu lịch và về trang chủ.
- [x] Dropdown chuyên khoa/bác sĩ dùng Select theo design system thay cho menu native của hệ điều hành.
- [x] Success state dùng typography và summary layout gọn, ưu tiên hiển thị đủ thông tin/CTA trong viewport desktop phổ biến.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Dùng schema lịch hẹn hiện có. |
| Backend | N/A | Public appointment endpoint đã đáp ứng toàn bộ quy tắc của slice. |
| Frontend API | `frontend/src/shared/api/appointments.ts` | Typed request/response tạo lịch và structured field errors. |
| Frontend UI | `frontend/src/pages/BookingPage.tsx`, `frontend/src/app/App.tsx`, `frontend/src/styles/customer.css` | Form một trang, custom Select, preselect bác sĩ, validation, summary và compact success state. |
| Tests | `frontend/src/pages/BookingPage.test.tsx` | Preselect, thao tác mở/chọn dropdown chuyên khoa, payload thành công, chống gọi API khi validation lỗi, invalid doctor và backend field errors. |

## Evidence

| Command/check | Result |
|---|---|
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test -- src/pages/BookingPage.test.tsx` | passed — 4 tests |
| `npm test -- src/app/App.auth.test.tsx` | passed — 3 tests |
| `npm test` | passed — 10 files, 27 tests |
| `npm run build` | passed |
| Frontend verification sau UI polish | passed — typecheck, lint, 10 files/28 tests, build |
| Frontend verification sau sửa regression dropdown | passed — typecheck, lint, 10 files/29 tests, build |

## Open items

- Cảnh báo chunk JavaScript lớn hơn 500 kB của Vite không chặn build; xử lý ở slice hoàn thiện.
