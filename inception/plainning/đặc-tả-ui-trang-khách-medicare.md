# Đặc tả UI trang khách Phòng khám Medicare

## 1. Trạng thái tài liệu

- Trạng thái: Chấp nhận ngày 2026-09-19.
- Phạm vi: giao diện công khai cho khách hàng trong MVP.
- Không bao gồm: CMS tin tức, thanh toán, tài khoản bệnh nhân hoặc nghiệp vụ bệnh viện nội trú.

Tài liệu này là nguồn thiết kế đã được duyệt cho increment UI trang khách. Mọi thay đổi phạm vi hoặc quyết định tại mục 19 sau thời điểm phê duyệt phải được review trước khi triển khai.

## 2. Mục tiêu trải nghiệm

Phòng khám Medicare là website giới thiệu cơ sở y tế kết hợp đặt lịch khám nhanh. Giao diện phải giúp khách truy cập:

1. Nhận biết đây là một phòng khám đáng tin cậy.
2. Xem thông tin tổng quan, hình ảnh phòng khám và nội dung sức khỏe tham khảo.
3. Tìm bác sĩ theo tên hoặc chuyên khoa và xem hồ sơ chi tiết.
4. Đặt lịch không cần tài khoản với ít thao tác.
5. Nhận mã lịch hẹn và thông tin xác nhận qua email.

Ưu tiên chính của UI là trình diễn rõ luồng nghiệp vụ Python/Django đã có. Nội dung marketing và tin tức chỉ cần đủ tạo tinh thần của website phòng khám demo.

## 3. Nguồn tham khảo và nguyên tắc áp dụng

### 3.1. Nguồn tham khảo

- Bệnh viện Đa khoa Quốc tế Nam Sài Gòn: tham khảo thứ bậc thông tin y tế, khu vực hotline, hình ảnh cơ sở và CTA đặt lịch.
- Shadcn Studio PureSkin: tham khảo bố cục hero, giới thiệu phòng khám, chuyên gia, form tư vấn, FAQ và footer.
- Shadcn Studio Ink: tham khảo card tin tức và lưới bài viết dễ quét.
- Shadcn Studio Zolt: chỉ tham khảo bento grid cho hình ảnh cơ sở vật chất và thông tin nhanh.

### 3.2. Nguyên tắc áp dụng

- Không sao chép nguyên template, hình ảnh, nội dung hoặc nhận diện thương hiệu.
- Dựng lại pattern cần thiết bằng React, Vite, TypeScript, Tailwind CSS và shadcn/ui hiện có.
- Không đưa Next.js, Astro hoặc SSR vào dự án; tuân thủ ADR-005 và ADR-006.
- Dùng API hiện có làm nguồn dữ liệu cho bác sĩ, chuyên khoa và đặt lịch.
- Tin tức và thông tin phòng khám là dữ liệu tĩnh trong frontend ở MVP.
- Trang khách mang cảm giác phòng khám, không mang phong cách dashboard SaaS.

## 4. Nhận diện thương hiệu

### 4.1. Thông tin thương hiệu

- Tên hiển thị: **Phòng khám Medicare**.
- Tên ngắn trên logo: **Medicare**.
- Slogan demo: **Tận tâm chăm sóc — Đồng hành sức khỏe**.
- Logo: `frontend/src/assets/images/medicare-logo.png`.

### 4.2. Thông tin liên hệ demo

Các thông tin sau là dữ liệu giả lập, không đại diện cho cơ sở y tế thật:

- Địa chỉ: 123 Nguyễn Văn Linh, Quận 7, TP.HCM.
- Hotline: 1900 6868.
- Email: lienhe@medicare-demo.vn.
- Thứ Hai–Thứ Bảy: 07:00–20:00.
- Chủ Nhật: 07:00–12:00.

Footer phải ghi rõ đây là website demo phục vụ đồ án và nội dung sức khỏe chỉ mang tính tham khảo.

### 4.3. Design tokens

| Token | Giá trị đề xuất | Vai trò |
|---|---|---|
| `brand-navy` | `#0D3B5C` | Heading, footer, nội dung nhấn mạnh |
| `brand-teal` | `#0C8A7B` | CTA chính, link, trạng thái tích cực |
| `brand-teal-dark` | `#076B61` | Hover/pressed của CTA |
| `brand-aqua` | `#DDF4EF` | Nền section, badge, icon container |
| `surface` | `#FFFFFF` | Card và form |
| `background` | `#F6FAF9` | Nền trang |
| `text` | `#183230` | Nội dung chính |
| `muted` | `#667C78` | Nội dung phụ |
| `border` | `#DCE7E4` | Viền nhẹ |
| `danger` | `#B84242` | Lỗi validation |
| `warning` | `#A96C1F` | Cảnh báo |

- Font chính: Geist Variable đã có trong frontend.
- Heading lớn: đậm, letter-spacing âm nhẹ; không vượt quá `64px` trên desktop.
- Nội dung: tối thiểu `16px`, line-height khoảng `1.6`.
- Radius: `10–16px`; pill chỉ dùng cho badge hoặc trạng thái.
- Shadow: nhẹ, ưu tiên viền và khoảng trắng thay cho shadow lớn.
- Icon: Lucide, nét thống nhất; không trộn nhiều bộ icon.

## 5. Kiến trúc thông tin và route

| Route | Mục đích | Dữ liệu |
|---|---|---|
| `/` | Giới thiệu phòng khám, điểm vào luồng chính | Nội dung tĩnh + bác sĩ/chuyên khoa public |
| `/doctors` | Tìm và lọc bác sĩ | `GET /api/v1/doctors`, `GET /api/v1/specialties` |
| `/doctors/:doctorId` | Xem hồ sơ bác sĩ | `GET /api/v1/doctors/{id}` |
| `/booking` | Đặt lịch khám nhanh | API bác sĩ/chuyên khoa + `POST /api/v1/appointments` |
| `/login` | Điểm vào khu vực nội bộ | Giữ ngoài layout khách |

Không tạo route tin tức hoặc giới thiệu riêng trong increment này. Các liên kết “Giới thiệu”, “Chuyên khoa” và “Tin tức” trên trang chủ dùng anchor đến section tương ứng. Thiết kế vẫn cho phép tách thành route riêng ở increment sau.

## 6. Layout dùng chung

### 6.1. Thanh tiện ích

- Hiển thị trên desktop: hotline, giờ làm việc và địa chỉ demo.
- Mobile chỉ giữ hotline và giờ làm việc để tránh quá tải.
- Nền navy, chữ trắng hoặc aqua nhạt.

### 6.2. Header

- Logo Medicare ở trái; logo dẫn về `/`.
- Điều hướng: Trang chủ, Giới thiệu, Chuyên khoa, Bác sĩ và Tin tức.
- CTA chính `Đặt lịch khám` ở phải.
- Header sticky sau khi cuộn, nền trắng có blur nhẹ và viền dưới.
- Link active phải nhận biết bằng màu/đường nhấn, không chỉ bằng hover.
- Mobile dùng menu Sheet/Drawer; CTA đặt lịch vẫn xuất hiện nổi bật.

### 6.3. Footer

- Logo, slogan và mô tả ngắn.
- Địa chỉ, hotline, email, giờ làm việc.
- Liên kết nhanh đến các route công khai.
- Cảnh báo: chatbot và nội dung sức khỏe không thay thế chẩn đoán hoặc tư vấn khẩn cấp.
- Nhãn rõ: “Website demo phục vụ đồ án Python”.

### 6.4. Chatbot

- Giữ chatbot nổi trên mọi route khách.
- Không hiển thị ở `/login` và `/admin/*`.
- Trên mobile, launcher không được che CTA cố định, nút submit hoặc màn xác nhận đặt lịch.

## 7. Trang chủ

### 7.1. Hero

- Bố cục desktop: nội dung và CTA ở trái, ảnh phòng khám ở phải hoặc ảnh toàn chiều rộng có lớp phủ bảo đảm tương phản.
- Heading đề xuất: **Chăm sóc sức khỏe tận tâm, đặt lịch thật thuận tiện**.
- Mô tả ngắn về khám theo chuyên khoa và đặt lịch không cần tài khoản.
- CTA chính: `Đặt lịch khám` → `/booking`.
- CTA phụ: `Tìm bác sĩ` → `/doctors`.
- Có thể kèm chip “Đặt lịch không cần đăng nhập”.
- Không dùng carousel tự chạy; một hero rõ ràng tốt hơn cho demo và accessibility.

### 7.2. Thao tác nhanh

Hai card hoặc button lớn:

1. Đặt lịch khám.
2. Tìm bác sĩ.
Mỗi mục có icon, tiêu đề và một câu mô tả. Toàn bộ card phải bấm được và có focus state.

### 7.3. Giới thiệu phòng khám

- Anchor: `#gioi-thieu`.
- Một ảnh khu vực tiếp nhận hoặc mặt tiền phòng khám.
- Đoạn giới thiệu 60–100 từ.
- Ba số liệu demo, ghi rõ tính chất minh họa nếu cần:
  - 10+ bác sĩ/chuyên gia.
  - 8+ chuyên khoa.
  - Hỗ trợ đặt lịch trực tuyến 24/7.

Không đưa số bệnh nhân hoặc tỷ lệ thành công giả làm dữ liệu thực.

### 7.4. Chuyên khoa nổi bật

- Anchor: `#chuyen-khoa`.
- Lấy tối đa 6 chuyên khoa đang hoạt động từ API.
- Card gồm icon chung, tên, mô tả rút gọn và link xem bác sĩ.
- Khi API lỗi, section hiển thị thông báo gọn và không làm hỏng toàn trang.
- Khi không có dữ liệu, hiển thị empty state trung tính.

### 7.5. Bác sĩ nổi bật

- Lấy tối đa 4 bác sĩ đang hoạt động từ API.
- Card gồm ảnh, tên, học vị, chuyên khoa, kinh nghiệm và hai hành động:
  - `Xem hồ sơ`.
  - `Đặt lịch` với `doctor_id` được truyền qua query string.
- Ảnh fallback phải thống nhất khi bác sĩ chưa có ảnh.
- Có link `Xem tất cả bác sĩ` đến `/doctors`.

### 7.6. Cơ sở vật chất

- Bento grid từ 3–4 ảnh demo:
  - Mặt tiền phòng khám.
  - Sảnh tiếp nhận.
  - Phòng tư vấn.
  - Phòng khám hoặc thiết bị y tế.
- Mỗi ảnh có alt text mô tả đúng nội dung, không nhồi từ khóa.
- Không dùng ảnh có logo bệnh viện thật, dữ liệu bệnh nhân hoặc gương mặt nhận diện nếu chưa có quyền sử dụng.

### 7.7. Quy trình đặt lịch

Hiển thị bốn bước có số thứ tự:

1. Chọn chuyên khoa hoặc bác sĩ.
2. Chọn ngày và buổi khám.
3. Nhập thông tin liên hệ và lý do khám.
4. Nhận mã lịch hẹn qua màn hình/email demo.

Copy phải nói rõ lịch được chọn theo **buổi sáng/chiều**, không theo giờ cụ thể.

### 7.8. Tin tức tham khảo

- Anchor: `#tin-tuc`.
- Ba card nội dung tĩnh; không gọi API và không có CMS.
- Mỗi card gồm ảnh, nhóm chủ đề, tiêu đề, tóm tắt 2–3 dòng và ngày demo.
- Nội dung đề xuất:
  - Hướng dẫn đặt lịch khám tại Medicare.
  - Vì sao nên khám sức khỏe định kỳ?
  - Những điều cần chuẩn bị trước khi đến phòng khám.
- Card không bắt buộc dẫn đến trang chi tiết trong increment này; nếu có nút, dùng `Đọc tóm tắt` mở Dialog hoặc bỏ CTA để tránh link chết.

### 7.9. CTA cuối trang

- Nền navy hoặc teal đậm.
- Nội dung ngắn: đặt lịch trước để giảm thời gian chờ.
- Nút `Đặt lịch ngay` và link hotline demo.

## 8. Danh sách bác sĩ

### 8.1. Header trang

- Breadcrumb hoặc link về trang chủ.
- Heading `Đội ngũ bác sĩ Medicare`.
- Mô tả ngắn về việc tìm theo tên hoặc chuyên khoa.

### 8.2. Bộ lọc

- Input tìm theo tên.
- Select chuyên khoa.
- Nút `Tìm kiếm` và `Xóa bộ lọc`.
- Trên mobile xếp dọc; không dùng modal cho bộ lọc MVP.
- Submit bằng Enter phải hoạt động.

### 8.3. Danh sách

- Desktop: 3 card mỗi hàng; tablet: 2; mobile: 1.
- Card ưu tiên ảnh và thông tin chuyên môn, tránh mô tả dài.
- Tên hiển thị ghép học vị và họ tên trên cùng một dòng, ví dụ `BS.CKII Nguyễn Văn A`; không lặp học vị ở dòng riêng.
- Ảnh profile dùng khung tỷ lệ ổn định và ưu tiên vùng khuôn mặt, không kéo giãn hoặc crop lệch.
- Loading dùng Skeleton card thay vì chỉ hiển thị văn bản.
- Có empty state và error state với nút thử lại.

## 9. Chi tiết bác sĩ

- Hero hồ sơ gồm ảnh, tên đã ghép học vị, chức vụ, chuyên khoa và kinh nghiệm; không tách học vị thành một dòng lặp lại.
- CTA `Đặt lịch với bác sĩ` phải nằm trong vùng nhìn thấy đầu tiên trên desktop.
- Section giới thiệu chuyên môn.
- Section lĩnh vực chuyên sâu lấy từ `expertises` nếu có.
- Khi trường tùy chọn trống, ẩn section hoặc dùng câu trung tính; không hiển thị nhiều dòng “Chưa cập nhật”.
- Loading, not-found và API error đều có đường quay lại danh sách bác sĩ.
- Query đặt lịch: `/booking?doctor_id=<id>`.

## 10. Trang đặt lịch

### 10.1. Bố cục

- Desktop: form chính chiếm khoảng 2/3 và panel hướng dẫn/tóm tắt chiếm 1/3.
- Mobile: một cột; tóm tắt nằm trước nút submit hoặc trong khối có thể thu gọn.
- Dùng một form theo nhóm thay vì wizard nhiều trang để phù hợp quy mô MVP.

### 10.2. Nhóm trường

**Thông tin khám**

- Chuyên khoa — bắt buộc.
- Bác sĩ — tùy chọn, lọc theo chuyên khoa nếu đã chọn.
- Ngày khám — bắt buộc; không cho chọn ngày quá khứ.
- Buổi khám — bắt buộc; `MORNING` hoặc `AFTERNOON`.
- Lý do khám — bắt buộc.

**Thông tin khách hàng**

- Họ và tên — bắt buộc.
- Số điện thoại — bắt buộc.
- Email — bắt buộc và đúng định dạng.

Nếu có `doctor_id` hợp lệ trên URL, form tự chọn bác sĩ và chuyên khoa tương ứng. Nếu không hợp lệ hoặc bác sĩ không hoạt động, hiển thị cảnh báo và cho khách chọn lại.

### 10.3. Submit và thành công

- Nút submit có loading state và chống gửi lặp trong khi request đang chạy.
- Validation phía client giúp nhập liệu nhưng không thay thế validation backend.
- Lỗi trường từ API đặt gần trường liên quan; lỗi tổng quát dùng Alert.
- Thành công hiển thị:
  - Thông báo lịch đã được xác nhận.
  - Mã lịch hẹn dễ sao chép.
  - Chuyên khoa, bác sĩ nếu có, ngày và buổi khám.
  - Nhắc kiểm tra email xác nhận.
  - CTA `Đặt lịch khác` và `Về trang chủ`.
- Không tự suy diễn giờ khám cụ thể.

## 11. Xác nhận và bảo vệ thông tin lịch

- Không có route hoặc CTA tra cứu lịch công khai.
- Màn thành công hiển thị mã tham chiếu và tóm tắt lịch vừa tạo.
- Email HTML có nhận diện Medicare, thông tin lịch và hướng dẫn tiếp nhận; có bản text dự phòng.
- Khách kiểm tra email hoặc liên hệ phòng khám và đọc số điện thoại/mã lịch cho nhân viên.
- Chỉ khu vực nội bộ đã đăng nhập được xem và tìm lịch hẹn.

## 12. UI states dùng chung

Mọi trang gọi API phải có:

- Initial/loading state.
- Success state.
- Empty/no-result state.
- Validation state.
- Network/server error state.
- Retry action khi phù hợp.

Không dùng toast làm nơi duy nhất hiển thị lỗi quan trọng. Toast chỉ hỗ trợ phản hồi ngắn; thông tin cần đọc lại phải nằm trong trang.

## 13. Responsive

Các mốc tham chiếu:

- Mobile: `< 640px`.
- Tablet: `640–1023px`.
- Desktop: `>= 1024px`.
- Nội dung chính có `max-width` khoảng `1200–1280px`.

Yêu cầu:

- Không có scroll ngang ở độ rộng 320px.
- Vùng bấm tối thiểu khoảng `44x44px`.
- Form trên mobile dùng một cột.
- Ảnh phải giữ tỷ lệ và không làm layout shift lớn.
- Card grid giảm từ 3/4 cột xuống 2 rồi 1 cột.
- Chatbot và CTA không che nhau.

## 14. Accessibility

- Dùng semantic landmarks: `header`, `nav`, `main`, `section`, `footer`.
- Mỗi trang chỉ có một `h1`; heading section theo thứ tự hợp lý.
- Mọi input có label thật; placeholder không thay label.
- Focus state nhìn thấy rõ và có tương phản đủ.
- Menu mobile, dialog và chatbot hỗ trợ bàn phím và quản lý focus.
- Ảnh nội dung có alt text; ảnh trang trí dùng alt rỗng.
- Không truyền đạt trạng thái chỉ bằng màu.
- Tôn trọng `prefers-reduced-motion`; animation chỉ nhẹ và không cản thao tác.
- Thông báo lỗi/success quan trọng dùng vùng `aria-live` phù hợp.

## 15. Tài sản hình ảnh

### 15.1. Asset cần có

| Asset | Tỷ lệ gợi ý | Nơi dùng |
|---|---:|---|
| Mặt tiền Phòng khám Medicare | `16:10` hoặc `16:9` | Hero |
| Sảnh tiếp nhận | `4:3` | Giới thiệu/Bento |
| Bác sĩ tư vấn khách hàng | `4:3` | Giới thiệu/Bento |
| Phòng khám hoặc thiết bị | `4:3` | Bento |

### 15.2. Quy tắc

- Asset tạo mới phải là hình phòng khám hư cấu, không mô phỏng cơ sở thật.
- Không có logo bên thứ ba, watermark hoặc dữ liệu bệnh nhân.
- Lưu source tại `frontend/src/assets/images/` và import từ component.
- Tối ưu kích thước cho web; ưu tiên WebP nếu quy trình build hỗ trợ.
- Không tải ảnh từ URL bên ngoài lúc runtime cho các ảnh thương hiệu chính.

## 16. Component map đề xuất

| Nhu cầu | Component/pattern |
|---|---|
| CTA | shadcn `Button` |
| Bác sĩ/chuyên khoa/tin tức | `Card`, `Badge`, `Avatar` |
| Form | `Input`, `Label`, `Select`, `Textarea`, `Button` |
| Phản hồi | `Alert`, `Sonner`, inline field message |
| Loading | `Skeleton` |
| Menu mobile | `Sheet` hoặc Drawer pattern tương đương |
| Chi tiết tóm tắt | `Dialog` khi thực sự cần |
| FAQ/hướng dẫn | `Accordion` nếu được thêm vào component set |
| Icon | `lucide-react` |

Chỉ thêm component shadcn cần dùng; không sao chép toàn bộ template hoặc cài thư viện UI thứ hai.

## 17. Acceptance criteria

### 17.1. Nhận diện và layout

- [ ] Tất cả route khách sử dụng header/footer chung và thương hiệu Phòng khám Medicare.
- [ ] Logo hiển thị rõ trên desktop/mobile và dẫn về trang chủ.
- [ ] Giao diện dùng nhất quán bảng màu navy–teal–trắng.
- [ ] Không còn nội dung walking skeleton hoặc “route placeholder” trên route khách.

### 17.2. Trang chủ

- [ ] Hero có ảnh phòng khám, thông điệp và CTA đặt lịch/tìm bác sĩ.
- [ ] Có các section giới thiệu, thao tác nhanh, chuyên khoa, bác sĩ, cơ sở vật chất, quy trình và tin tức tham khảo.
- [ ] Chuyên khoa và bác sĩ dùng API public; tin tức dùng dữ liệu tĩnh.

### 17.3. Luồng bác sĩ

- [ ] Khách tìm/lọc bác sĩ và xem loading, empty, error state phù hợp.
- [ ] Trang chi tiết hiển thị thông tin chuyên môn và CTA đặt lịch có `doctor_id`.

### 17.4. Đặt lịch và xác nhận

- [ ] Khách đặt được lịch không cần đăng nhập theo đúng contract hiện có.
- [ ] Bác sĩ là tùy chọn; ngày và buổi khám là bắt buộc.
- [ ] Thành công hiển thị booking code và tóm tắt lịch.
- [ ] Không tồn tại route/API tra cứu lịch công khai.
- [ ] Email HTML hiển thị thông tin lịch và hướng dẫn tiếp nhận.

### 17.5. Chất lượng

- [ ] Không có scroll ngang ở 320px và layout hợp lý ở mobile/tablet/desktop.
- [ ] Điều hướng, form, dialog/menu và chatbot dùng được bằng bàn phím.
- [ ] Frontend typecheck, lint, test và build đều đạt.
- [ ] Component test bao phủ luồng đặt lịch thành công/lỗi và việc không còn route tra cứu.

## 18. Thứ tự triển khai sau khi spec được duyệt

1. **Nền tảng UI công khai:** tokens, header, footer, responsive shell và asset hình ảnh.
2. **Trang chủ:** nội dung tĩnh, chuyên khoa/bác sĩ nổi bật và các state API.
3. **Luồng bác sĩ:** chuẩn hóa danh sách và chi tiết theo design system mới.
4. **Đặt lịch nhanh:** typed API client, form, validation và success state.
5. **Email xác nhận và bảo vệ dữ liệu:** HTML email, gỡ public lookup và test hồi quy.
6. **Hoàn thiện:** accessibility, responsive, test và verification gate.

Mỗi slice phải giữ backend/API làm nguồn chân lý và không thay đổi quy tắc nghiệp vụ đã chốt.

## 19. Quyết định đã phê duyệt

Người dùng đã phê duyệt ngày 2026-09-19:

- [x] Loại bỏ tra cứu lịch công khai; dùng email xác nhận và mã tham chiếu khi tiếp nhận.

- [x] Cấu trúc trang và thứ tự section.
- [x] Nhận diện Phòng khám Medicare cùng slogan/thông tin demo.
- [x] Design tokens navy–teal–trắng.
- [x] Tin tức tĩnh, không có CMS hoặc trang chi tiết trong MVP.
- [x] Form đặt lịch một trang, không dùng wizard nhiều bước.
- [x] Bộ bốn ảnh phòng khám hư cấu sẽ được tạo sau khi duyệt spec.
