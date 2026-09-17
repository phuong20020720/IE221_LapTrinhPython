---
name: medibook-aidlc-steer
description: Điều phối công việc MediBook theo AI-DLC, đánh giá trạng thái artifact, chọn chặng tiếp theo và quản lý approval gate. Dùng khi bắt đầu hoặc tiếp tục một increment, hỏi bước tiếp theo, thay đổi phạm vi/kiến trúc, hoặc cần định tuyến sang scaffold, implementation hay verification.
---

# Điều phối AI-DLC cho MediBook

Tuân theo yêu cầu trực tiếp của người dùng trước các mặc định trong skill.

## Khởi tạo ngữ cảnh

1. Đọc `AGENTS.md` và kiểm tra `git status` trước khi đề xuất thay đổi.
2. Đọc `inception/aidlc-state.md` nếu tồn tại.
3. Đọc các artifact liên quan trong `inception/plainning/`, `inception/architecture/` và `inception/architecture/adr/`.
4. Phân biệt quyết định đã `Chấp nhận` với đề xuất chưa được duyệt.
5. Đọc [references/gates.md](references/gates.md) để áp dụng gate và state schema.

## Định tuyến công việc

- Dùng `$medibook-aidlc-scaffold` khi architecture đã được duyệt nhưng source base/walking skeleton chưa tồn tại.
- Dùng `$medibook-aidlc-implement` khi triển khai một feature hoặc vertical slice từ yêu cầu đã chốt.
- Dùng `$medibook-aidlc-verify` khi cần review, test, chứng minh traceability hoặc quyết định có qua gate hay không.
- Giữ công việc trong skill này khi mục tiêu là đánh giá trạng thái, phân rã increment, tạo kế hoạch hoặc xử lý thay đổi quyết định.

Đọc đầy đủ `SKILL.md` của skill được chọn trước khi thực hiện hành động thuộc chặng đó.

## Quản lý quyết định và gate

1. Không tự đánh dấu approval của con người.
2. Không sửa âm thầm ADR đã chấp nhận. Nếu yêu cầu mới xung đột, tạo đề xuất ADR thay thế và dừng ở Architecture Gate.
3. Không dựng source khi business rule hoặc stack nền tảng còn mâu thuẫn.
4. Chỉ đánh dấu gate kỹ thuật đạt khi có bằng chứng từ file, lệnh kiểm tra hoặc test.
5. Cập nhật `inception/aidlc-state.md` khi bắt đầu increment, thay đổi chặng hoặc có kết quả gate; giữ nội dung ngắn và kiểm chứng được.

## Đầu ra

Luôn báo:

- trạng thái lifecycle hiện tại;
- artifact đã đủ và artifact còn thiếu;
- route/skill tiếp theo;
- approval cần người dùng quyết định;
- rủi ro hoặc mâu thuẫn đang chặn tiến độ.

Không biến nghi thức AI-DLC thành tài liệu thừa: chỉ tạo artifact phục vụ quyết định, triển khai, truy vết hoặc kiểm chứng.
