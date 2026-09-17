# ADR-003: Giới hạn chatbot ở knowledge và API facade

## Trạng thái

Chấp nhận

## Bối cảnh

Chatbot là chức năng công khai cho thông tin phòng khám, quy định đặt lịch và kiến thức sức khỏe phổ thông. Patient và Appointment chứa dữ liệu nhạy cảm.

## Quyết định

Chatbot chỉ truy cập knowledge đã duyệt và các API facade được thiết kế riêng. Chatbot không query trực tiếp bảng `patients`, `appointments` hoặc dữ liệu nội bộ.

## Lý do

- Giảm nguy cơ lộ thông tin cá nhân và lịch hẹn.
- Dễ kiểm soát nội dung, nguồn và phiên bản knowledge.
- Có thể thay provider/model mà không làm thay đổi domain modules.
- Phù hợp nguyên tắc chatbot chỉ cung cấp thông tin tham khảo.

## Hệ quả

MVP có thể lưu knowledge bằng Markdown/JSON được version-control. Nếu sau này cần tra cứu lịch hẹn, phải đi qua API được xác thực/giới hạn và chỉ trả các trường công khai cần thiết. Cần bổ sung rate limit, safety filter và monitoring lỗi model trước production.
