# Mô hình bảo mật và phân quyền

## Authentication

- Patient dùng public API, không có tài khoản trong MVP.
- Employee/Admin đăng nhập qua Django Authentication và nhận JWT access/refresh token.
- Mật khẩu chỉ lưu dưới dạng hash của Django; không log token hoặc thông tin nhạy cảm.
- Access token có thời hạn ngắn; refresh token dùng để cấp lại access token.

## Permission matrix

| Tài nguyên | Public/Patient | Employee | Admin |
|---|:---:|:---:|:---:|
| Xem thông tin phòng khám/bác sĩ | Có | Có | Có |
| Tạo lịch hẹn | Có | Không bắt buộc | Không bắt buộc |
| Xem/tra cứu lịch hẹn | Không | Bắt buộc | Employee/Admin |
| Xem/cập nhật bệnh nhân | Không | Có | Có |
| Xem/cập nhật lịch hẹn | Không | Có | Có |
| CRUD bác sĩ/chuyên khoa | Không | Không | Có |
| Quản lý tài khoản Employee | Không | Không | Có |
| Dashboard | Không | Có | Có |

## Quy tắc bảo vệ dữ liệu

1. Không cung cấp public lookup; API đọc lịch hẹn luôn yêu cầu Employee/Admin đã xác thực.
2. Không đưa dữ liệu bệnh nhân vào log, response chatbot hoặc telemetry không cần thiết.
3. Validate và authorize ở backend, không tin role do frontend gửi lên.
4. Dùng CORS allowlist, CSRF protection phù hợp và giới hạn tốc độ cho public endpoints.
5. Dùng soft delete/trạng thái `is_active` cho dữ liệu có lịch sử liên quan.
6. Secret, database URL và JWT key chỉ lấy từ environment; commit `.env.example`, không commit `.env`.

## Chatbot safety

Chatbot chỉ dùng knowledge đã duyệt, phải nêu tính chất tham khảo, không chẩn đoán/kê đơn và phải hướng người dùng đến cơ sở y tế khi có dấu hiệu nguy hiểm.

Lịch sử chat do public client gửi lên là dữ liệu không đáng tin cậy: chỉ nhận tối đa 6 tin nhắn, validate độ dài/role, kiểm tra lại các lượt user qua safety boundary và chỉ dùng làm context tạm thời cho provider. Không lưu lịch sử chat vào database hoặc dùng nó để truy cập dữ liệu Patient/Appointment.
