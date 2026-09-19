# Luồng bác sĩ công khai Medicare

## Sources

- Requirement: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#8-danh-sách-bác-sĩ`
- Requirement: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#9-chi-tiết-bác-sĩ`
- API contract: `inception/architecture/api-contract.md#public-endpoints`
- ADR: `ADR-005`, `ADR-006`

## Acceptance criteria

- [x] Danh sách bác sĩ đọc và ghi bộ lọc tên/chuyên khoa trên query string.
- [x] Link chuyên khoa từ Trang chủ tự áp dụng `specialty_id` khi mở danh sách.
- [x] Form tìm kiếm có label, submit bằng Enter và hành động xóa bộ lọc.
- [x] Danh sách có skeleton loading, empty state, error state và retry.
- [x] Card bác sĩ có ảnh fallback, thông tin chuyên môn, link hồ sơ và CTA đặt lịch.
- [x] Ảnh bác sĩ đã upload dùng trực tiếp `profile_image_url` từ backend; chỉ fallback khi URL rỗng hoặc tải ảnh lỗi.
- [x] Trang chi tiết có breadcrumb, thông tin đầu trang, kinh nghiệm và lĩnh vực chuyên sâu khi có dữ liệu.
- [x] Trường tùy chọn trống được ẩn hoặc dùng nội dung trung tính phù hợp.
- [x] CTA chi tiết truyền đúng `/booking?doctor_id=<id>`.
- [x] Trạng thái ID không hợp lệ và lỗi API đều có đường quay lại danh sách; lỗi API có retry.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Không thay đổi schema hoặc dữ liệu bác sĩ. |
| Backend | N/A | Dùng nguyên trạng public doctor/specialty endpoints. |
| Frontend | `frontend/src/pages/DoctorsPage.tsx`, `frontend/src/pages/DoctorDetailPage.tsx`, `frontend/src/pages/HomePage.tsx`, `frontend/src/shared/lib/doctorImage.ts`, `frontend/src/styles/customer.css` | Bộ lọc URL, card grid, UI states, hồ sơ bác sĩ, URL ảnh media/fallback và CTA đặt lịch. |
| Test config | `frontend/vite.config.ts` | Tăng test timeout lên 10 giây để ổn định suite jsdom khi chạy song song. |
| Tests | `frontend/src/pages/DoctorsPages.test.tsx`, `frontend/src/shared/lib/doctorImage.test.ts` | Query filter, tìm kiếm, empty state, chi tiết, chuyên môn, booking link, retry và regression ảnh media. |

## Evidence

| Command/check | Result |
|---|---|
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test -- src/pages/DoctorsPages.test.tsx` | passed — 4 tests |
| `npm test` | passed — 8 files, 21 tests |
| `npm run build` | passed |
| `npm test -- src/shared/lib/doctorImage.test.ts src/pages/DoctorsPages.test.tsx src/pages/HomePage.test.tsx` | passed — 3 files, 9 tests |

## Open items

- Cảnh báo chunk JavaScript lớn hơn 500 kB của Vite không chặn build; xử lý ở slice hoàn thiện.
