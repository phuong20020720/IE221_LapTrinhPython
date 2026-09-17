# MediBook — Tổng quan kiến trúc

## Mục tiêu

MediBook là hệ thống đặt lịch khám cho phòng khám. Bản MVP ưu tiên luồng đặt lịch công khai, quản lý bệnh nhân/lịch hẹn nội bộ và phân quyền Admin/Employee. Kiến trúc được giữ đơn giản để phù hợp đồ án, dễ kiểm thử và có đường mở rộng sau này.

## Quyết định kiến trúc chính

- Monorepo gồm `backend/` và `frontend/`.
- Backend dùng Python, Django và Django REST Framework.
- Frontend là một SPA dùng React, Vite và TypeScript; public/admin là các nhóm route trong cùng ứng dụng.
- PostgreSQL là database chính.
- API nội bộ dùng JWT Bearer token và permission theo role.
- Chatbot là module/service riêng, chỉ truy cập nội dung đã duyệt và API công khai cần thiết.
- Triển khai ban đầu theo modular monolith; chưa tách microservice.

## Nguyên tắc

1. Business rule phải được kiểm tra ở backend; frontend chỉ hỗ trợ trải nghiệm.
2. Giữ lịch sử lịch hẹn bằng trạng thái, hạn chế hard delete dữ liệu nghiệp vụ.
3. Tách public API khỏi internal API bằng permission và serializer rõ ràng.
4. Không để chatbot truy cập trực tiếp bảng `patients` hoặc `appointments`.
5. Mọi quyết định làm thay đổi cấu trúc lớn phải có ADR.

## Luồng chính

```text
Patient → React SPA public routes → Django REST API → PostgreSQL
Employee/Admin → React SPA protected routes → JWT-protected API → PostgreSQL
Patient → Chatbot UI → Chatbot module → approved knowledge/API facade
```

## Bản ghi quyết định

Các quyết định nền tảng được lưu trong `inception/architecture/adr/`. ADR có trạng thái `Chấp nhận` là cơ sở để scaffold source; thay đổi quyết định phải tạo ADR mới thay thế, không sửa mất lịch sử.

## Ngoài phạm vi MVP

Thanh toán, hồ sơ bệnh án điện tử, SMS/email thật, nhiều chi nhánh, lịch làm việc phức tạp và microservice production.
