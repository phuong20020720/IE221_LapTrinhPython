# Admin UI Bác sĩ và Chuyên khoa

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#2.4-admin`
- Business rules: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#7-quy-tắc-bác-sĩ-và-chuyên-khoa`
- Architecture: `inception/architecture/api-contract.md`
- ADR: `inception/architecture/adr/005-single-spa-frontend.md`

## Acceptance criteria

- [x] Admin dùng layout sáng gồm sidebar, topbar, dashboard và responsive mobile.
- [x] UI dùng component shadcn/ui thay cho bộ control tự viết cho phần triển khai mới.
- [x] Danh sách Bác sĩ có tìm kiếm, lọc chuyên khoa/trạng thái, trạng thái tải/rỗng/lỗi.
- [x] Admin thêm, sửa, ngừng/kích hoạt bác sĩ và upload/gỡ ảnh JPG, PNG hoặc WEBP tối đa 5 MB.
- [x] Bác sĩ thuộc đúng một chuyên khoa và có thể nhập nhiều lĩnh vực chuyên sâu.
- [x] Danh sách Chuyên khoa có tìm kiếm, lọc trạng thái, thêm, sửa, ngừng/kích hoạt và thông tin liên hệ.
- [x] Frontend gọi các endpoint Admin riêng dưới `/api/v1/admin/`.
- [x] Combobox trong form không bị CSS legacy ghi đè.
- [x] Thao tác đổi trạng thái dùng AlertDialog và mọi thao tác ghi có toast phản hồi.
- [x] Danh sách hiển thị rõ họ tên và có popup xem chi tiết bác sĩ.
- [x] Thông tin tài khoản nằm ở footer sidebar cạnh đăng xuất; danh mục Chuyên khoa không dùng avatar chữ cái.
- [x] Các màn hình nội bộ cũ Bệnh nhân, Nhân viên và Đăng nhập đã chuyển sang shadcn/ui đồng bộ.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| UI foundation | `components.json`, `src/components/ui/*`, `src/lib/utils.ts`, Vite/TypeScript config | shadcn/ui, Tailwind v4, alias import |
| Admin shell | `src/app/AdminLayout.tsx`, `src/pages/AdminDashboardPage.tsx`, `src/styles/index.css` | Sidebar, topbar, dashboard, responsive layout |
| Doctors | `src/pages/AdminDoctorsPage.tsx`, `src/shared/api/doctors.ts` | Table/filter/form/upload/expertises và Admin API |
| Specialties | `src/pages/SpecialtiesPage.tsx`, `src/shared/api/specialties.ts` | Table/filter/form/contact và Admin API |
| Patients/Employees | `src/pages/PatientsPage.tsx`, `src/pages/EmployeesPage.tsx` | Table, filter, form, confirm và toast đồng bộ shadcn/ui |
| Internal login | `src/pages/LoginPage.tsx` | Card, form và error state bằng shadcn/ui |
| Public compatibility | `src/pages/DoctorsPage.tsx`, `src/pages/DoctorDetailPage.tsx` | Đồng bộ public UI với response schema mới |
| Tests | `src/pages/AdminCatalogPages.test.tsx`, `src/pages/AdminPeoplePages.test.tsx`, `src/app/App.auth.test.tsx`, `src/test/setup.ts` | Render dữ liệu, chi tiết/confirm dialog, form và regression auth layout |

## Evidence

| Command/check | Result |
|---|---|
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test` | 12 passed |
| `npm run build` | passed |

## Open items

- Visual smoke test thủ công trên trình duyệt local; công cụ trình duyệt trong phiên không kết nối được.
