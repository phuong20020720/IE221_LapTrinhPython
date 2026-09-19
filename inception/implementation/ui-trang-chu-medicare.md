# Trang chủ Phòng khám Medicare

## Sources

- Requirement: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#7-trang-chủ`
- API contract: `inception/architecture/api-contract.md#public-endpoints`
- Architecture: `inception/architecture/container-and-component-design.md`
- ADR: `ADR-005`, `ADR-006`

## Acceptance criteria

- [x] Trang chủ tải tối đa 6 chuyên khoa đang hoạt động từ public API.
- [x] Trang chủ tải tối đa 4 bác sĩ đang hoạt động từ public API.
- [x] Hai section API xử lý độc lập loading, empty, error và retry state.
- [x] Card chuyên khoa dẫn đến danh sách bác sĩ đã gắn `specialty_id`.
- [x] Card bác sĩ có ảnh fallback, link hồ sơ và link đặt lịch gắn `doctor_id`.
- [x] Quy trình đặt lịch mô tả đúng bốn bước và lựa chọn theo buổi sáng/chiều.
- [x] Ba tin tức tham khảo tĩnh có chủ đề, tiêu đề, mô tả, ngày và ảnh minh họa.
- [x] Anchor Chuyên khoa và Tin tức dẫn đến đúng section tương ứng.
- [x] Frontend typecheck, lint, test và production build đều đạt.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Dùng dữ liệu bác sĩ/chuyên khoa hiện có, không thay đổi schema. |
| Backend | N/A | Dùng nguyên trạng `GET /api/v1/specialties/` và `GET /api/v1/doctors/`. |
| Frontend | `frontend/src/pages/HomePage.tsx`, `frontend/src/styles/customer.css` | Dữ liệu nổi bật, UI states, quy trình, tin tức và responsive card grids. |
| Tests | `frontend/src/pages/HomePage.test.tsx` | Kiểm tra giới hạn dữ liệu, liên kết đặt lịch, nội dung tĩnh và retry sau lỗi API. |

## Evidence

| Command/check | Result |
|---|---|
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test -- src/pages/HomePage.test.tsx` | passed — 2 tests |
| `npm test` | passed — 7 files, 17 tests |
| `npm run build` | passed |

## Open items

- Cảnh báo chunk JavaScript lớn hơn 500 kB của Vite không chặn build; xử lý ở slice hoàn thiện.
