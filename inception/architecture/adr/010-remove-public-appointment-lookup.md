# ADR-010: Loại bỏ tra cứu lịch hẹn công khai

## Trạng thái

Chấp nhận — theo quyết định trực tiếp của chủ dự án ngày 2026-09-19.

## Bối cảnh

Khách đặt lịch không có tài khoản hoặc cơ chế xác thực danh tính. Tra cứu bằng số điện thoại có thể làm lộ lịch hẹn của người khác nếu số điện thoại bị biết hoặc nhập nhầm. Khách đã nhận thông tin lịch qua email xác nhận.

## Quyết định

- Gỡ route SPA `/lookup` và endpoint `GET /api/v1/appointments/lookup`.
- Gỡ mọi CTA và nội dung hướng khách đến chức năng tra cứu công khai.
- Tiếp tục sinh `booking_code` làm mã tham chiếu để khách đọc cho nhân viên tiếp nhận, không dùng làm quyền truy cập dữ liệu công khai.
- Chỉ Employee/Admin đã xác thực được xem và tìm lịch hẹn qua API nội bộ.
- Email xác nhận là kênh cung cấp lại thông tin lịch cho khách trong phạm vi demo.

## Lý do

Giảm nguy cơ lộ dữ liệu lịch khám và phù hợp mô hình khách không đăng nhập của MVP.

## Hệ quả

Khách muốn kiểm tra hoặc thay đổi lịch phải xem email xác nhận hoặc liên hệ phòng khám bằng số điện thoại/mã lịch. Nếu tương lai cần self-service, phải có cơ chế xác minh danh tính hoặc liên kết dùng một lần và một ADR thay thế.
