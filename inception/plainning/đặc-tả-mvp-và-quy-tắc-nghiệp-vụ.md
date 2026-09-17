# ĐẶC TẢ MVP VÀ QUY TẮC NGHIỆP VỤ

## 1. Mục tiêu MVP

MVP phải thể hiện được luồng đặt lịch khám, quản lý dữ liệu và phân quyền:

```text
Bệnh nhân xem bác sĩ
→ Chọn chuyên khoa/bác sĩ và thời gian
→ Nhập thông tin cá nhân, lý do khám
→ Hệ thống lưu bệnh nhân và lịch hẹn
→ Trả mã lịch hẹn
→ Bệnh nhân tra cứu lịch hẹn
```

```text
Employee đăng nhập
→ Xem, lọc và xử lý lịch hẹn
→ Quản lý thông tin bệnh nhân
```

## 2. Phạm vi chức năng MVP theo actor

### 2.1. Bệnh nhân

- Xem trang giới thiệu phòng khám.
- Xem danh sách bác sĩ và thông tin chi tiết.
- Lọc bác sĩ theo chuyên khoa.
- Chọn chuyên khoa, có thể chọn hoặc bỏ qua bác sĩ, ngày và buổi khám sáng/chiều.
- Nhập thông tin cá nhân và lý do khám.
- Đặt lịch khám không cần tài khoản.
- Nhận mã lịch hẹn sau khi đặt thành công.
- Tra cứu lịch hẹn bằng mã lịch hẹn hoặc số điện thoại.
- Hỏi chatbot về thông tin phòng khám, quy định đặt lịch và kiến thức sức khỏe phổ thông.
- Nhận cảnh báo an toàn khi câu hỏi có dấu hiệu cấp cứu hoặc yêu cầu chẩn đoán/kê đơn.

### 2.2. Employee

- Đăng nhập và làm mới access token.
- Xem dashboard.
- Xem danh sách, chi tiết và lọc lịch hẹn theo ngày, bác sĩ hoặc bệnh nhân.
- Cập nhật thông tin và trạng thái lịch hẹn.
- Xóa lịch hẹn khi cần theo quy tắc dữ liệu.
- Xem, thêm và sửa thông tin bệnh nhân.
- Tìm kiếm bệnh nhân theo tên hoặc số điện thoại.
- Xem các lịch hẹn liên quan đến bệnh nhân.

### 2.3. Chatbot AI

- Chatbot được truy cập công khai, không bắt buộc đăng nhập.
- Chatbot trả lời về thông tin phòng khám, quy định đặt/đổi/hủy lịch, tra cứu lịch và kiến thức sức khỏe phổ thông.
- Chatbot phải nêu rõ đây là thông tin tham khảo, không thay thế bác sĩ.
- Chatbot không được chẩn đoán bệnh, kê đơn, hướng dẫn liều thuốc hoặc khẳng định người dùng mắc một bệnh cụ thể.
- Khi phát hiện dấu hiệu nguy hiểm, chatbot phải khuyến nghị người dùng liên hệ cơ sở y tế hoặc cấp cứu phù hợp ngay.
- Chatbot không được tự ý truy cập hoặc tiết lộ thông tin bệnh nhân, lịch hẹn hay ghi chú nội bộ.

### 2.4. Admin

- Có toàn bộ quyền của Employee.
- Thêm, xem, sửa, xóa bác sĩ.
- Thêm, xem, sửa, xóa chuyên khoa và thông tin liên hệ chuyên khoa.
- Quản lý thông tin liên hệ của chuyên khoa.
- Quản lý tài khoản Employee.
- Xem toàn bộ dashboard và dữ liệu hệ thống.

## 3. Chức năng ngoài MVP

- Tài khoản bệnh nhân.
- Thanh toán trực tuyến.
- Hồ sơ bệnh án điện tử, kê đơn và bảo hiểm.
- Chat trực tiếp với bác sĩ, gọi điện hoặc tư vấn y khoa trực tuyến.
- Gửi SMS/email thực tế.
- Quản lý phòng, thiết bị, ca làm việc hoặc nhiều chi nhánh.
- Thông báo thời gian thực và microservice.

## 4. Actor và quyền tài khoản

### 4.1. Bệnh nhân

- Không có tài khoản đăng nhập.
- Được nhận diện bằng số điện thoại.
- Có thể tạo nhiều lịch hẹn.
- Chỉ truy cập API công khai.

### 4.2. Employee

- Là tài khoản nội bộ.
- Được quản lý lịch hẹn và bệnh nhân.
- Không được quản lý bác sĩ, chuyên khoa hoặc tài khoản Employee khác.

### 4.3. Admin

- Là tài khoản nội bộ có toàn quyền trong MVP.
- Được quản lý bệnh nhân, lịch hẹn, bác sĩ, chuyên khoa và tài khoản Employee.

## 5. Ma trận phân quyền

| Chức năng | Bệnh nhân | Employee | Admin |
|---|:---:|:---:|:---:|
| Xem trang giới thiệu phòng khám | ✓ | ✓ | ✓ |
| Xem/lọc danh sách bác sĩ | ✓ | ✓ | ✓ |
| Đặt lịch khám | ✓ | — | — |
| Tra cứu lịch hẹn | ✓ | — | — |
| Xem/lọc/cập nhật lịch hẹn | — | ✓ | ✓ |
| Xóa lịch hẹn | — | ✓ | ✓ |
| Thêm/sửa/xóa bệnh nhân | — | ✓ | ✓ |
| Tìm kiếm bệnh nhân | — | ✓ | ✓ |
| Thêm/sửa/xóa bác sĩ | — | — | ✓ |
| Thêm/sửa/xóa chuyên khoa | — | — | ✓ |
| Quản lý tài khoản Employee | — | — | ✓ |
| Xem dashboard | — | ✓ | ✓ |
| Hỏi chatbot AI công khai | ✓ | ✓ | ✓ |

## 6. Quy tắc dữ liệu bệnh nhân

1. Họ tên và số điện thoại là bắt buộc khi đặt lịch.
2. Email là tùy chọn nhưng phải đúng định dạng nếu được cung cấp.
3. Số điện thoại được chuẩn hóa trước khi tìm kiếm hoặc lưu.
4. Nếu số điện thoại đã tồn tại, lịch mới được gắn với bệnh nhân hiện có.
5. Thông tin mới không tự động ghi đè dữ liệu hiện có bằng giá trị rỗng.
6. Không xóa cứng bệnh nhân đã có lịch hẹn; có thể đánh dấu ngừng hoạt động nếu cần.

## 7. Quy tắc bác sĩ và chuyên khoa

1. Bác sĩ phải có họ tên, chuyên khoa và thông tin liên hệ cơ bản.
2. Chỉ bác sĩ đang hoạt động mới được hiển thị để đặt lịch.
3. Một bác sĩ có thể thuộc một chuyên khoa trong phạm vi MVP.
4. Chuyên khoa phải có tên duy nhất.
5. Không xóa cứng bác sĩ hoặc chuyên khoa đã phát sinh lịch hẹn; dùng trạng thái ngừng hoạt động.
6. Bệnh nhân có thể lọc danh sách bác sĩ theo chuyên khoa.
7. Hồ sơ bác sĩ có thể gồm học hàm/học vị, chức vụ, số năm kinh nghiệm, ảnh đại diện, mô tả chuyên môn và nhiều lĩnh vực chuyên sâu.

## 8. Quy tắc đặt lịch

1. Lịch hẹn phải có bệnh nhân, chuyên khoa, ngày khám, buổi khám và lý do khám; bác sĩ là tùy chọn.
2. Bệnh nhân đăng ký theo ngày và buổi khám, không đăng ký theo giờ cụ thể.
3. Buổi khám hợp lệ gồm `MORNING` (buổi sáng) hoặc `AFTERNOON` (buổi chiều).
4. Ngày khám phải ở tương lai hoặc theo quy định tiếp nhận của phòng khám.
5. Mỗi lịch hẹn có một mã tra cứu duy nhất, không tuần tự và khó đoán.
6. Nếu bệnh nhân chọn bác sĩ, lịch được tạo ở trạng thái `CONFIRMED`; nếu không chọn bác sĩ, lịch được tạo ở trạng thái `PENDING_ASSIGNMENT`.
7. Sau khi submit thành công, hệ thống phải thông báo rõ cho bệnh nhân rằng lịch đã đăng ký thành công và trả về mã lịch hẹn.
8. Không áp dụng quy tắc chống trùng lịch theo bác sĩ, ngày hoặc buổi.
9. Một bác sĩ có thể phục vụ nhiều bệnh nhân trong cùng một ngày và cùng một buổi.
10. Lịch `CANCELLED` hoặc đã xóa không được tính là lịch đang hoạt động trong các thống kê.
11. Khi bệnh nhân không chọn bác sĩ, Employee phải phân công một bác sĩ thuộc đúng chuyên khoa trước khi chuyển lịch sang `CONFIRMED`.

## 9. Quản lý lịch hẹn

1. Có thể lọc lịch theo ngày, bác sĩ hoặc bệnh nhân.
2. Có thể phân công/cập nhật bác sĩ, ngày khám, buổi khám, lý do khám và trạng thái nếu lịch chưa kết thúc.
3. Khi đổi bác sĩ, ngày hoặc buổi khám, hệ thống không cần kiểm tra chống trùng.
4. Xóa lịch hẹn chỉ dành cho tài khoản nội bộ và phải tuân thủ chính sách dữ liệu.
5. Ưu tiên chuyển sang `CANCELLED` thay vì xóa cứng để bảo toàn lịch sử.
6. Lịch đã `COMPLETED` hoặc `CANCELLED` không được chuyển sang trạng thái khác trong MVP.

## 10. Trạng thái lịch hẹn

| Mã trạng thái | Ý nghĩa |
|---|---|
| `PENDING_ASSIGNMENT` | Đã nhận yêu cầu nhưng chưa được phân công bác sĩ |
| `CONFIRMED` | Lịch đã được hệ thống ghi nhận và xác nhận thành công |
| `IN_PROGRESS` | Bệnh nhân đang được khám |
| `COMPLETED` | Lịch khám đã hoàn tất |
| `CANCELLED` | Lịch đã bị hủy hoặc bệnh nhân không đến khám |

Luồng hợp lệ:

```text
PENDING_ASSIGNMENT → CONFIRMED
       └────────────→ CANCELLED
CONFIRMED → IN_PROGRESS → COMPLETED
     ├──────────────→ CANCELLED (hủy trước khi khám)
     └──────────────→ CANCELLED (NO_SHOW - không đến khám)
```

Quy trình nghiệp vụ chính:

1. Khi bệnh nhân đặt lịch có chọn bác sĩ, hệ thống tạo lịch ở trạng thái `CONFIRMED`.
2. Khi bệnh nhân đặt lịch không chọn bác sĩ, hệ thống tạo lịch ở trạng thái `PENDING_ASSIGNMENT`.
3. Employee phân công bác sĩ thuộc đúng chuyên khoa và chuyển lịch sang `CONFIRMED`.
4. Khi bệnh nhân đến phòng khám và bắt đầu được khám, nhân viên chuyển lịch sang `IN_PROGRESS`.
5. Khi quá trình khám kết thúc, nhân viên chuyển lịch sang `COMPLETED`.
6. Nếu bệnh nhân không đến, nhân viên chuyển lịch sang `CANCELLED` với lý do `NO_SHOW`.
7. Nếu lịch bị hủy trước khi khám, nhân viên chuyển lịch sang `CANCELLED` và lưu lý do hủy.

Lịch `COMPLETED` và `CANCELLED` là trạng thái kết thúc, không được chuyển sang trạng thái khác trong MVP. Không được chuyển trực tiếp từ `CONFIRMED` sang `COMPLETED`; phải ghi nhận bước `IN_PROGRESS` khi bắt đầu khám.

## 11. Tra cứu lịch hẹn công khai

1. Bệnh nhân có thể tra cứu bằng một trong hai thông tin:
   - Mã lịch hẹn: trả về chi tiết lịch tương ứng.
   - Số điện thoại: trả về danh sách các lịch hẹn thuộc số điện thoại đó.
2. Không bắt buộc bệnh nhân phải cung cấp đồng thời mã lịch hẹn và số điện thoại.
3. Số điện thoại phải được chuẩn hóa trước khi tìm kiếm.
4. Nếu mã lịch hẹn hoặc số điện thoại không có kết quả, API trả về thông báo phù hợp và không tiết lộ dữ liệu của bệnh nhân khác.
5. Kết quả chỉ hiển thị mã lịch, tên bác sĩ nếu đã được phân công, chuyên khoa, ngày khám, buổi khám và trạng thái.
6. Không trả về ghi chú nội bộ hoặc dữ liệu nhạy cảm.

## 12. Đăng nhập và phân quyền

1. Chỉ Admin và Employee có tài khoản đăng nhập.
2. Mật khẩu được Django Authentication hash, không lưu dạng thuần.
3. Đăng nhập thành công trả về access token và refresh token bằng Simple JWT.
4. API nội bộ yêu cầu Bearer access token hợp lệ.
5. Quyền phải được kiểm tra tại backend bằng DRF Permission.
6. Ẩn nút trên frontend chỉ cải thiện giao diện, không thay thế kiểm tra quyền backend.

## 13. Dashboard MVP

Dashboard của Admin và Employee bắt buộc có:

- Tổng số lịch hẹn.
- Số lịch hẹn trong ngày.
- Tổng số bệnh nhân.
- Tổng số bác sĩ.
- Tổng số lịch theo trạng thái nếu cần cho màn hình tổng quan.

Biểu đồ bắt buộc:

- Số lịch hẹn theo tuần.
- Số lịch hẹn theo chuyên khoa.

## 14. Quy tắc thời gian và dữ liệu

1. Backend là nơi quyết định dữ liệu hợp lệ.
2. Thời gian được lưu dạng timezone-aware.
3. Múi giờ hiển thị nghiệp vụ là `Asia/Ho_Chi_Minh`.
4. Tạo hoặc cập nhật lịch hẹn phải dùng transaction khi có nhiều thay đổi liên quan.
5. Các bản ghi nghiệp vụ có thời điểm tạo và cập nhật.

## 15. Tiêu chí nghiệm thu MVP

### Kịch bản 1: Bệnh nhân đặt và tra cứu lịch

1. Bệnh nhân xem danh sách và chi tiết bác sĩ.
2. Bệnh nhân lọc theo chuyên khoa và chọn hoặc bỏ qua bác sĩ.
3. Bệnh nhân chọn ngày và buổi khám hợp lệ, nhập thông tin và lý do khám.
4. Hệ thống tạo hoặc sử dụng bệnh nhân đã tồn tại.
5. Hệ thống tạo lịch `CONFIRMED` nếu đã chọn bác sĩ hoặc `PENDING_ASSIGNMENT` nếu chưa chọn, hiển thị thông báo đăng ký thành công và trả mã tra cứu.
6. Bệnh nhân tra cứu được lịch bằng mã lịch hẹn hoặc số điện thoại.

### Kịch bản 2: Nhân viên quản lý lịch

1. Employee đăng nhập.
2. Employee xem và lọc danh sách lịch hẹn.
3. Employee xem chi tiết, cập nhật hoặc hủy lịch.
4. Employee tìm kiếm bệnh nhân và xem lịch liên quan.
5. Dashboard phản ánh dữ liệu mới.

### Kịch bản 3: Admin quản lý dữ liệu

1. Admin đăng nhập.
2. Admin CRUD bác sĩ và chuyên khoa.
3. Admin xem lịch hẹn của từng bác sĩ.
4. Employee bị từ chối khi gọi API chỉ dành cho Admin.

### Kịch bản 4: Kiểm tra lỗi nghiệp vụ

1. Không thể đặt lịch với bác sĩ ngừng hoạt động.
2. Không thể đặt lịch trong quá khứ hoặc với buổi khám không hợp lệ.
3. Có thể tạo nhiều lịch cho cùng bác sĩ, ngày và buổi khám.
4. Không thể chuyển trạng thái sai thứ tự.
5. Tra cứu bằng mã lịch hẹn hoặc số điện thoại không có kết quả khi thông tin không tồn tại.
6. Lịch không chọn bác sĩ không thể chuyển sang `CONFIRMED` nếu Employee chưa phân công bác sĩ đúng chuyên khoa.

### Kịch bản 5: Chatbot AI

1. Người dùng mở chatbot mà không cần đăng nhập.
2. Chatbot trả lời được câu hỏi về phòng khám, bác sĩ, chuyên khoa và quy định đặt lịch.
3. Chatbot trả lời kiến thức sức khỏe phổ thông với cảnh báo đây chỉ là thông tin tham khảo.
4. Chatbot từ chối chẩn đoán, kê đơn hoặc hướng dẫn liều thuốc cá nhân hóa.
5. Với dấu hiệu cấp cứu, chatbot khuyến nghị liên hệ cơ sở y tế hoặc cấp cứu ngay.
