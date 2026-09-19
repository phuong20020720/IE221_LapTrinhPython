# ADR-003: Giới hạn chatbot ở knowledge và API facade

## Trạng thái

Chấp nhận

## Bối cảnh

Chatbot là chức năng công khai cho thông tin phòng khám, quy định đặt lịch và kiến thức sức khỏe phổ thông. Patient và Appointment chứa dữ liệu nhạy cảm.

## Quyết định

Chatbot chỉ truy cập knowledge Markdown đã duyệt và API facade `POST /api/v1/chatbot/messages/`. Chatbot không query trực tiếp bảng `patients`, `appointments` hoặc dữ liệu nội bộ; không hỗ trợ tra cứu lịch công khai.

## Lý do

- Giảm nguy cơ lộ thông tin cá nhân và lịch hẹn.
- Dễ kiểm soát nội dung, nguồn và phiên bản knowledge.
- Có thể thay provider/model mà không làm thay đổi domain modules.
- Phù hợp nguyên tắc chatbot chỉ cung cấp thông tin tham khảo.

## Hệ quả

MVP lưu knowledge bằng Markdown được version-control tại `backend/apps/chatbot/knowledge/`. Thông tin lịch chỉ được xem qua API nội bộ có JWT và permission Employee/Admin; không mở facade tra cứu lịch cho chatbot. Cần bổ sung rate limit và monitoring lỗi model trước production; safety filter đã được triển khai ở boundary trước khi gọi provider.
