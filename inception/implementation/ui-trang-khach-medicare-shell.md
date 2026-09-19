# Nền tảng UI trang khách Phòng khám Medicare

## Sources

- Requirement: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#6-layout-dùng-chung`
- Requirement: `inception/plainning/đặc-tả-ui-trang-khách-medicare.md#15-tài-sản-hình-ảnh`
- Architecture: `inception/architecture/container-and-component-design.md`
- ADR: `ADR-005`, `ADR-006`

## Acceptance criteria

- [x] Các route khách dùng chung header, footer, logo và nhận diện Phòng khám Medicare.
- [x] Header có thanh thông tin, điều hướng desktop, menu mobile dùng được bằng bàn phím và CTA đặt lịch.
- [x] Layout khách dùng nhất quán design tokens navy–teal–trắng và có responsive breakpoints.
- [x] Trang chủ không còn nội dung walking skeleton, có hero, thao tác nhanh, giới thiệu, hình ảnh cơ sở và CTA.
- [x] Bốn ảnh phòng khám hư cấu được lưu cục bộ, tối ưu cho web và có alt text.
- [x] Chatbot mang thương hiệu Medicare, xuất hiện trên route khách và không xuất hiện ở route nội bộ.
- [x] Frontend typecheck, lint, test và production build đều đạt.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Slice chỉ thay đổi giao diện công khai, không thay đổi dữ liệu hay schema. |
| Backend | N/A | Giữ nguyên public API contract hiện có. |
| Frontend | `frontend/src/app/CustomerLayout.tsx`, `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/DoctorsPage.tsx`, `frontend/src/pages/DoctorDetailPage.tsx`, `frontend/src/pages/PlaceholderPage.tsx`, `frontend/src/features/chatbot/ChatbotWidget.tsx`, `frontend/src/styles/customer.css` | Cung cấp shell công khai, nhận diện Medicare, responsive navigation và nền trang chủ mới. |
| Assets | `frontend/src/assets/images/medicare-logo.png`, `frontend/src/assets/images/medicare-clinic-exterior.jpg`, `frontend/src/assets/images/medicare-reception.jpg`, `frontend/src/assets/images/medicare-consultation.jpg`, `frontend/src/assets/images/medicare-exam-room.jpg` | Logo và bộ ảnh phòng khám hư cấu dùng cục bộ, không phụ thuộc URL ngoài. |
| Tests | `frontend/src/app/App.test.tsx`, `frontend/src/features/chatbot/ChatbotWidget.test.tsx` | Kiểm tra nhận diện trang chủ, shell route bác sĩ, menu mobile, chatbot và việc loại trừ route nội bộ. |

## Evidence

| Command/check | Result |
|---|---|
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test -- --run` | passed — 6 files, 15 tests |
| `npm run build` | passed |
| Kiểm tra kích thước ảnh bằng `System.Drawing.Image` | passed — hero 1672×941; ba ảnh còn lại 1448×1086 |

## Open items

- Các section chuyên khoa, bác sĩ nổi bật, quy trình và tin tức đã được hoàn thiện trong `ui-trang-chu-medicare.md`.
- Cảnh báo chunk JavaScript lớn hơn 500 kB của Vite không chặn build; xem xét code splitting ở bước hoàn thiện.
