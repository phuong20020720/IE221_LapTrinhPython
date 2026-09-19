# ADR-009: Email local qua Mailpit

## Trạng thái

Chấp nhận

## Bối cảnh

Luồng đặt lịch công khai phải gửi email xác nhận sau khi tạo lịch thành công. Môi trường local cần kiểm tra được nội dung email mà không dùng tài khoản SMTP thật, không lưu thông tin xác thực và không gửi nhầm thư ra bên ngoài.

## Quyết định

- Thêm service `mailpit` vào Docker Compose bằng image chính thức `axllent/mailpit`.
- Django gửi email qua SMTP nội bộ tới host `mailpit`, port `1025`, không TLS và không xác thực trong môi trường local.
- Mailpit Web UI được mở tại `http://localhost:8025` để nhóm kiểm tra email xác nhận.
- Cấu hình email của Django phải đọc từ biến môi trường để có thể thay Mailpit bằng SMTP/provider thật khi triển khai production.
- Mailpit chỉ phục vụ local/test/demo; không được xem là dịch vụ chuyển phát email production.

## Lý do

- Không cần secret SMTP trong repository hoặc máy lập trình viên.
- Có thể kiểm tra người nhận, tiêu đề và nội dung email ngay trong luồng phát triển.
- Ngăn email thử nghiệm gửi tới địa chỉ thật.
- Giữ ứng dụng độc lập với một nhà cung cấp email cụ thể.

## Hệ quả

Docker Compose có thêm một service và cổng Web UI `8025`. Email gửi trong local chỉ xuất hiện trong Mailpit, khách hàng không nhận được tại Gmail hoặc hộp thư thật. Trước khi production cần cấu hình SMTP/provider có khả năng chuyển phát thực tế và quản lý thông tin xác thực bằng secret manager.
