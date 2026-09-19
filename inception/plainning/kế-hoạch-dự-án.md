# KẾ HOẠCH TỔNG QUAN – HỆ THỐNG ĐẶT LỊCH KHÁM

## 1. Bối cảnh dự án

Đây là đồ án môn Kỹ thuật lập trình Python thuộc chương trình đào tạo từ xa của Trường Đại học Công nghệ Thông tin – ĐHQG TP.HCM (UIT).

Mục tiêu của đồ án là xây dựng một website hỗ trợ bệnh nhân đặt lịch khám với bác sĩ tại phòng khám. Nhân viên và quản trị viên sử dụng hệ thống để quản lý thông tin bác sĩ, bệnh nhân, chuyên khoa và lịch hẹn.

Trong phạm vi môn học, hệ thống tập trung vào:

- Các chức năng CRUD cơ bản.
- REST API và lưu trữ dữ liệu.
- Quản lý lịch hẹn và kiểm tra trùng lịch.
- Đăng nhập, phân quyền Admin/Employee.
- Website công khai cho bệnh nhân không cần tài khoản.
- Chatbot AI công khai cho thông tin phòng khám, quy định đặt lịch và kiến thức sức khỏe phổ thông.

Đồ án không hướng đến việc xây dựng một hệ thống bệnh viện hoàn chỉnh ở mức production.

## 2. Đề tài

**Xây dựng hệ thống đặt lịch chăm sóc sức khỏe**

Hệ thống là website của một phòng khám, cho phép bệnh nhân xem thông tin phòng khám, tìm hiểu bác sĩ theo chuyên khoa, chọn thời gian khám và đặt lịch mà không cần đăng nhập. Khu vực nội bộ cho phép nhân viên và quản trị viên quản lý bệnh nhân, bác sĩ, chuyên khoa và lịch hẹn.

## 3. Mô tả tổng quan

Bệnh nhân truy cập các chức năng công khai để:

- Xem trang giới thiệu phòng khám.
- Xem danh sách và thông tin chi tiết bác sĩ.
- Lọc bác sĩ theo chuyên khoa.
- Chọn chuyên khoa, có thể chọn hoặc bỏ qua bác sĩ, ngày và buổi khám.
- Nhập thông tin cá nhân, lý do khám và gửi lịch hẹn.
- Nhận mã lịch hẹn và email xác nhận.
- Hỏi chatbot AI về phòng khám, quy định đặt lịch và kiến thức sức khỏe phổ thông.

Thông tin bệnh nhân được lưu khi đặt lịch. Nếu bệnh nhân đã tồn tại theo số điện thoại, hệ thống gắn lịch hẹn mới với hồ sơ hiện có.

Nhân viên và quản trị viên đăng nhập bằng tài khoản nội bộ để quản lý dữ liệu. Admin có toàn quyền; Employee được quản lý lịch hẹn và bệnh nhân.

## 4. Các đối tượng sử dụng



### 4.1. Bệnh nhân (Patient)

Bệnh nhân sử dụng các chức năng công khai, không bắt buộc có tài khoản. Bệnh nhân có thể đặt nhiều lịch hẹn và được nhận diện chủ yếu bằng số điện thoại.

### 4.2. Nhân viên (Employee)

Employee là người vận hành phòng khám. Employee đăng nhập bằng tài khoản nội bộ, quản lý lịch hẹn và thông tin bệnh nhân trong phạm vi được cấp quyền.

### 4.3. Quản trị viên (Admin)

Admin quản lý toàn bộ dữ liệu và tài khoản nội bộ, bao gồm bác sĩ, chuyên khoa, bệnh nhân và lịch hẹn.

## 5. Các nhóm tính năng chính theo actor



### 5.1. Bệnh nhân

Bệnh nhân sử dụng các chức năng công khai và không cần đăng nhập:

- Xem trang giới thiệu phòng khám.
- Xem danh sách bác sĩ.
- Xem thông tin chi tiết bác sĩ.
- Lọc bác sĩ theo chuyên khoa.
- Chọn chuyên khoa, có thể chọn hoặc bỏ qua bác sĩ, ngày và buổi khám.
- Nhập thông tin cá nhân và lý do khám.
- Đặt lịch khám.
- Nhận mã lịch hẹn sau khi đặt thành công.
- Dùng mã lịch hẹn làm mã tham chiếu khi liên hệ hoặc đến phòng khám; không tra cứu công khai.



### 5.2. Employee

Employee đăng nhập bằng tài khoản nội bộ và được quản lý vận hành:

- Xem dashboard.
- Hiển thị danh sách lịch hẹn.
- Lọc lịch theo ngày, bác sĩ hoặc bệnh nhân.
- Xem chi tiết lịch hẹn.
- Cập nhật thông tin và trạng thái lịch hẹn.
- Xóa hoặc hủy lịch hẹn khi cần theo quy tắc dữ liệu.
- Thêm, xem và sửa thông tin bệnh nhân.
- Tìm kiếm bệnh nhân theo tên hoặc số điện thoại.
- Xem các lịch hẹn liên quan đến bệnh nhân.



### 5.3. Admin

Admin đăng nhập bằng tài khoản nội bộ và có toàn quyền quản lý:

- Sử dụng toàn bộ chức năng của Employee.
- Thêm, xem, sửa và xóa thông tin bác sĩ.
- Gắn bác sĩ với chuyên khoa.
- Quản lý thông tin liên hệ và mô tả chuyên môn của bác sĩ.
- Quản lý học hàm/học vị, chức vụ, kinh nghiệm, ảnh đại diện và các lĩnh vực chuyên sâu của bác sĩ.
- Thêm, xem, sửa và xóa chuyên khoa.
- Quản lý tên và mô tả chuyên khoa; chuyên khoa là danh mục nên không lưu thông tin liên hệ.
- Xem danh sách bác sĩ thuộc từng chuyên khoa.
- Quản lý tài khoản Employee.



### 5.4. Dashboard dùng chung cho Employee và Admin

- Tổng số lịch hẹn.
- Số lịch hẹn trong ngày.
- Tổng số bệnh nhân.
- Tổng số bác sĩ.
- Biểu đồ số lịch hẹn theo tuần.
- Biểu đồ số lịch hẹn theo chuyên khoa.
- Cho phép chọn tuần tương lai để theo dõi lịch đã lên kế hoạch.



## 6. Luồng nghiệp vụ chính



### 6.1. Bệnh nhân đặt lịch

```text
Bệnh nhân
→ Xem danh sách bác sĩ
→ Lọc hoặc chọn chuyên khoa
→ Chọn hoặc bỏ qua bác sĩ
→ Chọn ngày và buổi khám
→ Nhập thông tin cá nhân và lý do khám
→ Đặt lịch
→ Hệ thống lưu hoặc cập nhật thông tin bệnh nhân
→ Hệ thống lưu lịch hẹn và trả về mã lịch hẹn
```



### 6.2. Nhân viên xử lý lịch hẹn

```text
Nhân viên
→ Đăng nhập
→ Xem danh sách lịch hẹn
→ Lọc theo ngày, bác sĩ hoặc bệnh nhân
→ Xem chi tiết và phân công bác sĩ nếu lịch chưa có bác sĩ
→ Cập nhật hoặc xóa lịch hẹn khi cần
```



## 7. Yêu cầu tổng quan



### 7.1. Yêu cầu chức năng

- Có website công khai giới thiệu phòng khám và bác sĩ.
- Cho phép lọc bác sĩ theo chuyên khoa.
- Cho phép đặt lịch khám không cần tài khoản.
- Lưu thông tin bệnh nhân và lịch hẹn.
- Kiểm tra dữ liệu đặt lịch hợp lệ ở backend; không chống trùng bác sĩ/ngày/buổi theo quy tắc MVP.
- Quản lý CRUD bệnh nhân, bác sĩ và chuyên khoa.
- Quản lý, lọc, cập nhật và xóa lịch hẹn.
- Có đăng nhập và phân quyền Admin/Employee.
- Có dashboard với các chỉ số và biểu đồ đã nêu.
- Frontend giao tiếp với backend thông qua REST API.



### 7.2. Phạm vi không bao gồm

Thanh toán trực tuyến, hồ sơ bệnh án điện tử, kê đơn, bảo hiểm, tư vấn trực tuyến, gửi SMS thực tế hoặc email ngoài xác nhận đặt lịch, quản lý thiết bị/phòng khám, đa chi nhánh và kiến trúc microservice không thuộc MVP.

## 8. Công nghệ dự kiến



### 8.1. Backend

- Python, Django, Django REST Framework.
- Django ORM và Django Migration.
- Backend cung cấp REST API, xử lý nghiệp vụ và kiểm tra quyền.

c

### 8.2. Frontend

- React, Vite và TypeScript theo mô hình SPA.
- Giao tiếp với backend bằng REST API/JSON.
- Chatbot chỉ cung cấp thông tin tham khảo, không chẩn đoán, kê đơn hoặc thay thế bác sĩ.
- Có website công khai và khu vực quản trị riêng.



### 8.3. Database và xác thực

- PostgreSQL.
- Django Authentication kết hợp `djangorestframework-simplejwt`.
- API nội bộ dùng Bearer access token và DRF Permission.



## 9. Định hướng triển khai

1. Chốt phạm vi MVP và quy tắc nghiệp vụ.
2. Thiết kế database và ERD cho bệnh nhân, bác sĩ, chuyên khoa, lịch hẹn, tài khoản và quyết định lưu trữ chatbot.
3. Thiết kế REST API, gồm API chatbot với giới hạn phạm vi và kiểm soát an toàn.
4. Khởi tạo backend Django/DRF và frontend React/Vite SPA.
5. Xây dựng đăng nhập và phân quyền.
6. Xây dựng module bác sĩ, lĩnh vực chuyên sâu, chuyên khoa, bệnh nhân và lịch hẹn.
7. Xây dựng luồng đặt lịch theo buổi, cho phép bỏ qua bác sĩ và phân công sau.
8. Xây dựng dashboard.
9. Xây dựng chatbot AI từ nguồn kiến thức được phê duyệt.
10. Kiểm thử các luồng chính, chatbot và chuẩn bị dữ liệu demo.
