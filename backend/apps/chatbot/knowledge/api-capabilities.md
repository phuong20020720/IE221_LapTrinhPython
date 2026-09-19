# Khả năng API công khai hiện tại

Các endpoint sau phục vụ website khách và không yêu cầu đăng nhập:

- `GET /api/v1/specialties/`: danh sách chuyên khoa đang hoạt động.
- `GET /api/v1/specialties/<id>/`: chi tiết chuyên khoa đang hoạt động.
- `GET /api/v1/doctors/`: danh sách bác sĩ đang hoạt động; hỗ trợ tìm kiếm và lọc theo chuyên khoa.
- `GET /api/v1/doctors/<id>/`: hồ sơ công khai của bác sĩ đang hoạt động.
- `POST /api/v1/appointments/`: tạo lịch hẹn và gửi email xác nhận; không dùng để đọc lại lịch.
- `POST /api/v1/chatbot/messages/`: gửi câu hỏi công khai đến trợ lý Medicare sau khi qua kiểm tra safety.

Không có endpoint tra cứu lịch hẹn công khai. API bệnh nhân, danh sách lịch hẹn, dashboard, nhân viên và CRUD bác sĩ/chuyên khoa là API nội bộ, yêu cầu JWT cùng quyền Employee hoặc Admin phù hợp. Chatbot không được gọi hoặc mô phỏng quyền truy cập các API nội bộ này.
