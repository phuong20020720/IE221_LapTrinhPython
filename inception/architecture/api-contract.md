# API Contract

API prefix dự kiến: `/api/v1/`. Response dùng JSON và lỗi có cấu trúc thống nhất.

## Public endpoints

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/specialties` | Danh sách chuyên khoa đang hoạt động |
| `GET` | `/doctors` | Danh sách/lọc bác sĩ |
| `GET` | `/doctors/{id}` | Chi tiết bác sĩ |
| `POST` | `/appointments` | Tạo lịch hẹn không cần đăng nhập |
| `GET` | `/appointments/lookup` | Tra cứu bằng mã lịch hoặc số điện thoại |
| `POST` | `/chatbot/messages` | Gửi câu hỏi thông tin công khai |

## Internal endpoints

| Method | Endpoint | Role |
|---|---|---|
| `POST` | `/auth/token` | Employee/Admin |
| `POST` | `/auth/token/refresh` | Employee/Admin |
| `GET/PATCH` | `/patients/{id}` | Employee/Admin |
| `GET/PATCH/DELETE` | `/appointments/{id}` | Employee/Admin; `DELETE` được xử lý như hủy lịch theo quy tắc nghiệp vụ |
| `GET/POST/PATCH/DELETE` | `/doctors`, `/specialties` | Admin |
| `GET` | `/dashboard/summary` | Employee/Admin |

## Quy ước request/response

- Dùng ISO-8601 cho ngày/giờ và timezone `Asia/Ho_Chi_Minh`.
- Dùng `MORNING`/`AFTERNOON` cho buổi khám.
- Dùng `PENDING_ASSIGNMENT`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` cho trạng thái.
- Tạo lịch thành công trả HTTP `201` và `booking_code`.
- Validation lỗi trả `400`; chưa xác thực trả `401`; không đủ quyền trả `403`; không tìm thấy trả `404`.
- SPA gửi JWT trong header `Authorization: Bearer <access_token>` cho internal endpoints.

Ví dụ tạo lịch:

```json
{
  "full_name": "Nguyen Van A",
  "phone": "0901234567",
  "email": "a@example.com",
  "specialty_id": 1,
  "doctor_id": null,
  "appointment_date": "2026-10-05",
  "session": "MORNING",
  "reason": "Kham tong quat"
}
```
