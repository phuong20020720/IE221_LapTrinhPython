# Phân công công việc nhóm MediBook

> Cập nhật phạm vi 2026-09-19: mọi hạng mục public booking/lookup bên dưới được hiểu là chỉ còn booking; public lookup đã bị loại bỏ theo ADR-010.

## 1. Cơ cấu nhóm

Giả định nhóm có **5 thành viên**:

- 01 BA kiêm QA.
- 04 Developer, trong đó **Developer 1 là trưởng nhóm và phụ trách Chatbot**.

Thay các tên placeholder dưới đây bằng tên thật trước khi bắt đầu sprint.

## 2. Nguyên tắc phân công

Mỗi Developer sở hữu một vertical slice gồm database, backend API, frontend và automated test của module. Người sở hữu module chịu trách nhiệm chính nhưng vẫn phải review chéo. Không chia kiểu “một người chỉ làm FE, một người chỉ làm BE” vì dễ tạo điểm nghẽn tích hợp.

## 3. Bảng phân công chính

| Thành viên | Vai trò/module | Backend | Frontend | Đầu ra chính |
|---|---|---|---|---|
| **Bạn – Developer 1/Leader** | Chatbot, Dashboard, Integration | Chatbot boundary, knowledge adapter, safety rule, API `/chatbot/messages`; dashboard query API; hỗ trợ tích hợp Appointment | Chatbot UI; dashboard cards/charts; hỗ trợ FE đặt/tra cứu lịch khi Developer 4 quá tải | Chatbot an toàn, dashboard, tích hợp toàn hệ thống, review kiến trúc |
| **Thành viên 2 – Developer** | Accounts, Authentication, Patients | Custom User, JWT, role permission, CRUD Employee; Patient model, chuẩn hóa số điện thoại, CRUD/tìm kiếm Patient | Login/logout/refresh token, protected routes, quản lý Employee và Patient | Đăng nhập/phân quyền chạy được; quản lý Patient đúng rule |
| **Thành viên 3 – Developer** | Specialties, Doctors | Specialty, Doctor, DoctorExpertise; CRUD, lọc theo chuyên khoa, active/inactive, constraint và migration | Trang danh sách/chi tiết/lọc bác sĩ; màn hình Admin quản lý bác sĩ và chuyên khoa | Public doctor catalog và Admin CRUD hoàn chỉnh |
| **Thành viên 4 – Developer** | Appointments, Booking, Lookup | Tạo lịch, booking code, gắn Patient, state transition, hủy lịch, lọc lịch và permission Employee | Luồng đặt lịch công khai, tra cứu lịch, màn hình Employee quản lý/cập nhật lịch | Luồng nghiệp vụ cốt lõi từ đặt đến xử lý lịch |
| **Thành viên 5 – BA/QA** | Requirements, Acceptance, Quality | Review API contract, business rule, permission và dữ liệu test; không sở hữu production code | Review user flow, nội dung, validation và usability | Backlog, acceptance criteria, test case, bug report, regression/UAT report |

## 4. Chi tiết trách nhiệm

### Developer 1 – Chatbot, Dashboard và Integration

- Quản lý `apps/chatbot`, `apps/dashboard` và feature frontend tương ứng.
- Chatbot chỉ dùng knowledge đã duyệt; không query trực tiếp `patients` hoặc `appointments`.
- Thêm cảnh báo thông tin tham khảo, từ chối chẩn đoán/kê đơn và hướng dẫn cấp cứu khi cần.
- Xây dựng dashboard sau khi API Appointment/Patient/Doctor ổn định.
- Theo dõi API contract, xử lý conflict tích hợp, review migration và hỗ trợ Developer 4 phần booking/lookup frontend nếu tiến độ lệch.
- Không tự mở rộng chatbot thành tư vấn y khoa hoặc lưu lịch sử nhạy cảm ngoài MVP.

### Developer 2 – Accounts, Authentication và Patients

- Hoàn thiện `accounts.User`, role `ADMIN`/`EMPLOYEE`, JWT login/refresh và DRF permission.
- Admin được quản lý Employee; Employee không được quản lý tài khoản khác.
- Xây dựng Patient model/API/UI: thêm, xem, sửa, tìm theo tên/số điện thoại.
- Chuẩn hóa và đảm bảo số điện thoại duy nhất; không ghi đè dữ liệu hiện có bằng giá trị rỗng.
- Cung cấp Patient service ổn định để Developer 4 dùng trong transaction đặt lịch.

### Developer 3 – Specialties và Doctors

- Xây dựng model, migration, service, serializer và permission cho Specialty/Doctor/DoctorExpertise.
- Chỉ Admin được CRUD; public chỉ xem dữ liệu đang hoạt động.
- Xây dựng trang public danh sách/chi tiết/lọc bác sĩ và màn hình Admin tương ứng.
- Quản lý ảnh bác sĩ trong `frontend/src/assets/images/` đối với ảnh demo; không commit dữ liệu cá nhân thật.
- Cung cấp API ổn định cho form booking của Developer 4.

### Developer 4 – Appointments

- Xây dựng Appointment model, booking code UUID, session, status và cancellation data.
- Dùng `transaction.atomic()` khi tìm/tạo Patient và tạo Appointment.
- Kiểm tra doctor thuộc specialty, dữ liệu active, ngày khám và state transition.
- Xây dựng public booking/lookup và màn hình Employee lọc/xử lý lịch.
- Không thêm constraint chống trùng doctor/ngày/buổi vì MVP hiện cho phép nhiều lịch cùng buổi.
- Báo sớm cho Leader nếu khối lượng FE booking/lookup gây chậm; Leader sẽ nhận phần UI/integration được tách rõ.

### BA/QA

- Chuyển đặc tả thành backlog và acceptance criteria có thể kiểm thử.
- Chốt request/response và error case với Developer trước khi code.
- Chuẩn bị test data giả, không dùng dữ liệu bệnh nhân thật.
- Viết test case cho happy path, validation, permission, trạng thái lịch và chatbot safety.
- Test mỗi PR trên `dev`, ghi bug gồm bước tái hiện, expected, actual, mức độ và bằng chứng.
- Thực hiện regression và UAT; BA/QA xác nhận nghiệp vụ, nhưng approval merge vẫn cần code review của Developer.

## 5. Thứ tự triển khai và dependency

```text
Accounts/Auth ───────────────┐
Patients ────────────────────┼→ Appointments → Dashboard
Specialties → Doctors ───────┘

Approved Knowledge → Chatbot
```

### Giai đoạn 1 – Nền dữ liệu

- Developer 2: Accounts/Auth trước, sau đó Patient.
- Developer 3: Specialty trước, sau đó Doctor/Expertise.
- Developer 1: knowledge format, chatbot safety contract và integration conventions.
- Developer 4: thống nhất Appointment API/state machine, chỉ bắt đầu migration khi dependency đã chốt.
- BA/QA: acceptance criteria và test case cho từng module.

### Giai đoạn 2 – Luồng nghiệp vụ

- Developer 4 triển khai booking, lookup và xử lý lịch.
- Developer 1 triển khai chatbot, đồng thời hỗ trợ booking frontend nếu cần.
- Developer 2/3 hoàn thiện các màn hình quản trị thuộc module mình.
- BA/QA test từng vertical slice ngay khi lên `dev`.

### Giai đoạn 3 – Tổng hợp

- Developer 1 triển khai Dashboard từ API đã ổn định.
- Cả nhóm sửa integration bug, permission bug và regression.
- BA/QA chạy năm kịch bản nghiệm thu MVP trong đặc tả.

## 6. Quy tắc Git và Pull Request

- Nhánh tích hợp: `dev`; không push trực tiếp vào `main` hoặc `dev`.
- Nhánh đề xuất: `feature/auth-patients`, `feature/doctors-specialties`, `feature/appointments`, `feature/chatbot`, `feature/dashboard`.
- Mỗi PR chỉ nên chứa một outcome có thể test; base branch là `dev`.
- PR phải ghi requirement liên quan, migration, endpoint/UI thay đổi và lệnh test đã chạy.
- Tối thiểu một Developer khác review; BA/QA xác nhận acceptance criteria cho PR có thay đổi nghiệp vụ.
- Chỉ người sở hữu app tạo/sửa migration trong app đó. Thay đổi chéo module phải báo owner trước.

## 7. Definition of Done cho mỗi module

- [ ] Model và migration không còn thay đổi chưa sinh.
- [ ] Serializer input/output và API khớp contract.
- [ ] Business rule nằm ở backend service, không chỉ ở frontend.
- [ ] Permission có test cho trường hợp được phép và bị từ chối.
- [ ] FE có loading, empty, validation và error state cần thiết.
- [ ] Backend test, frontend typecheck/lint/test/build đều đạt.
- [ ] BA/QA đã kiểm acceptance criteria và không còn bug blocker.
- [ ] Tài liệu/API contract được cập nhật nếu hành vi thay đổi.

## 8. Đánh giá cân bằng khối lượng

Appointment là module nặng và có nhiều dependency nhất. Chatbot và Dashboard cũng có rủi ro tích hợp nhưng có thể triển khai tách giai đoạn. Vì vậy:

- Developer 4 tập trung backend Appointment và màn hình Employee trước.
- Developer 1 nhận thêm Dashboard, integration và sẵn sàng tách phần public booking/lookup frontend khỏi Developer 4.
- Developer 2 hoàn thành Patient service sớm để giảm việc cho Developer 4.
- Developer 3 hoàn thành API public Doctor/Specialty sớm để booking không bị chặn.

Nhóm nên đánh giá lại khối lượng sau mỗi tuần. Chỉ chuyển task khi có interface rõ ràng, tránh hai người cùng sửa một migration hoặc cùng sở hữu một file nghiệp vụ.
