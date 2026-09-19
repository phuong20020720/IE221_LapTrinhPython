# Hướng dẫn đặt lịch Medicare

## Kênh và quy trình

- Khách truy cập trang `/booking` hoặc chọn nút **Đặt lịch khám** trên website; không cần đăng nhập.
- Khách chọn chuyên khoa, có thể chọn hoặc bỏ qua bác sĩ, sau đó chọn ngày khám và buổi `Sáng` hoặc `Chiều`.
- Biểu mẫu yêu cầu họ tên, số điện thoại, email hợp lệ và lý do khám. Các thông tin này chỉ nhập trong biểu mẫu đặt lịch, không gửi qua chatbot.
- Ngày khám không được ở trong quá khứ. Hệ thống không đặt theo giờ cụ thể trong MVP.
- Lịch hợp lệ được xác nhận ngay cả khi chưa chọn bác sĩ; nhân viên có thể phân công bác sĩ sau.

## Sau khi đặt lịch

- Hệ thống hiển thị mã lịch hẹn, chuyên khoa, bác sĩ nếu đã chọn, ngày và buổi khám.
- Email xác nhận Medicare được gửi đến email khách đã nhập, gồm thông tin lịch và hướng dẫn tiếp nhận.
- Không có chức năng tra cứu lịch công khai bằng số điện thoại hoặc mã lịch hẹn.
- Để xem lại thông tin, khách kiểm tra email xác nhận. Khi cần hỗ trợ, gọi 1900 6868 và cung cấp mã lịch hẹn hoặc số điện thoại cho nhân viên tiếp nhận.
- Chỉ Admin hoặc Employee đã đăng nhập mới được xem, tìm kiếm và cập nhật lịch hẹn trong khu vực nội bộ.

## Các trang công khai

- Trang chủ: `/`.
- Danh sách và bộ lọc bác sĩ: `/doctors`.
- Hồ sơ bác sĩ: `/doctors/<id>`.
- Đặt lịch khám: `/booking`.
