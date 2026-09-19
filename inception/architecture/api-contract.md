# API Contract

API prefix dự kiến: `/api/v1/`. Response dùng JSON và lỗi có cấu trúc thống nhất.

## Public endpoints

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/specialties` | Danh sách chuyên khoa đang hoạt động |
| `GET` | `/specialties/{id}` | Chi tiết chuyên khoa đang hoạt động |
| `GET` | `/doctors` | Danh sách/lọc bác sĩ |
| `GET` | `/doctors/{id}` | Chi tiết bác sĩ |
| `POST` | `/appointments` | Tạo lịch hẹn không cần đăng nhập |
| `POST` | `/chatbot/messages` | Gửi câu hỏi thông tin công khai |

## Internal endpoints

| Method | Endpoint | Role |
|---|---|---|
| `POST` | `/auth/token` | Employee/Admin — trả `access`, `refresh` và `user` |
| `POST` | `/auth/token/refresh` | Employee/Admin |
| `GET` | `/auth/me` | Employee/Admin — thông tin phiên hiện tại |
| `GET/POST` | `/employees` | Admin — danh sách/tạo tài khoản Employee |
| `GET/PATCH/DELETE` | `/employees/{id}` | Admin — `DELETE` vô hiệu hóa (`is_active=false`) |
| `GET/POST` | `/patients` | Employee/Admin — `GET` hỗ trợ `?q=` tìm theo tên hoặc SĐT |
| `GET/PATCH/DELETE` | `/patients/{id}` | Employee/Admin — `DELETE` vô hiệu hóa hồ sơ |
| `GET` | `/appointments` | Employee/Admin — danh sách công việc có lọc và phân trang |
| `GET/PATCH/DELETE` | `/appointments/{id}` | Employee/Admin; `DELETE` được xử lý như hủy lịch theo quy tắc nghiệp vụ |
| `GET/POST` | `/admin/doctors`, `/admin/specialties` | Admin — danh sách/tạo mới |
| `GET/PATCH/DELETE` | `/admin/doctors/{id}`, `/admin/specialties/{id}` | Admin — xem/sửa/ngừng hoạt động |
| `DELETE` | `/admin/doctors/{id}/profile-image` | Admin — gỡ ảnh đại diện |
| `GET` | `/dashboard/summary` | Employee/Admin — thẻ tổng quan, lịch tuần hiện tại và bệnh nhân mới 6 tháng gần nhất |

## Quy ước request/response

- Dùng ISO-8601 cho ngày/giờ và timezone `Asia/Ho_Chi_Minh`.
- Dùng `MORNING`/`AFTERNOON` cho buổi khám.
- Dùng `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` cho trạng thái.
- Tạo lịch thành công trả HTTP `201` và `booking_code`.
- `GET /appointments` hỗ trợ lọc bằng `q`, `status`, `session`, `appointment_date`, `specialty_id`, `doctor_id`, `patient_id` và phạm vi công việc `scope=today|upcoming|unassigned|history|all`.
- Mọi endpoint danh sách (`employees`, `patients`, `appointments`, public/admin `doctors` và public/admin `specialties`) dùng phân trang server với `page`, `page_size`; mặc định 10, tối đa 100, response `{ count, next, previous, results }`.
- Các danh sách quản trị hỗ trợ lọc trạng thái bằng `is_active=true|false`; tìm kiếm và lọc được áp dụng trước khi phân trang.
- `GET /dashboard/summary` nhận tùy chọn `week_date=YYYY-MM-DD` để lấy tuần chứa ngày đã chọn và `month=YYYY-MM` để lấy cửa sổ 6 tháng kết thúc tại tháng đã chọn; cho phép chọn mốc tương lai để theo dõi lịch đã lên kế hoạch.
- Email là bắt buộc khi đặt lịch. Mọi lịch hợp lệ được tạo `CONFIRMED`; `doctor_id` có thể để trống.
- Sau khi transaction tạo lịch thành công, hệ thống gửi email HTML có nhận diện Medicare, mã lịch, chuyên khoa, bác sĩ nếu có, ngày, buổi khám và hướng dẫn tiếp nhận; kèm bản text dự phòng. Local nhận thư qua Mailpit theo ADR-009.
- Validation lỗi trả `400`; chưa xác thực trả `401`; không đủ quyền trả `403`; không tìm thấy trả `404`.
- SPA gửi JWT trong header `Authorization: Bearer <access_token>` cho internal endpoints.
- API public chỉ trả bác sĩ/chuyên khoa đang hoạt động và không trả thông tin liên hệ nội bộ.
- Không có endpoint đọc lịch hẹn công khai; lịch chỉ được xem trong API nội bộ có xác thực.
- API Admin tách dưới prefix `/admin/`; thao tác xóa bác sĩ/chuyên khoa là soft delete.
- Tạo/cập nhật bác sĩ có ảnh dùng `multipart/form-data`; ảnh nhận JPG, PNG hoặc WEBP, tối đa 5 MB.
- Số điện thoại bệnh nhân được chuẩn hóa về dạng `0xxxxxxxxx` trước khi lưu hoặc tìm kiếm.
- Không ghi đè email/họ tên bệnh nhân hiện có bằng chuỗi rỗng khi cập nhật.
- `POST /chatbot/messages` nhận `message` và `history` tùy chọn gồm tối đa 6 phần tử `{ role: "user"|"assistant", text }`; backend validate lại, loại context user không qua safety và không lưu lịch sử vào database.

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
