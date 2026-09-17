---
name: medibook-aidlc-implement
description: Triển khai feature MediBook thành vertical slice có truy vết từ business rule qua Django API, PostgreSQL và React SPA đến test. Dùng cho CRUD, đặt/tra cứu lịch, auth, dashboard, chatbot hoặc thay đổi hành vi sau khi source base và ADR liên quan đã sẵn sàng.
---

# Triển khai vertical slice MediBook

Tuân theo yêu cầu trực tiếp của người dùng trước các mặc định trong skill.

## Xác định increment

1. Đọc `AGENTS.md`, `inception/aidlc-state.md`, `git status` và code hiện tại.
2. Tìm heading nguồn trong tài liệu planning, database và API contract; không triển khai từ trí nhớ.
3. Đọc mọi ADR liên quan và [references/vertical-slice.md](references/vertical-slice.md).
4. Thu hẹp yêu cầu về một outcome có thể kiểm thử. Nếu yêu cầu gồm nhiều outcome độc lập, lập thứ tự slice và chỉ bắt đầu slice đầu tiên trừ khi người dùng yêu cầu toàn bộ.
5. Nếu yêu cầu mâu thuẫn ADR hoặc business rule, dừng và chuyển về `$medibook-aidlc-steer`.

## Triển khai

1. Ghi nguồn yêu cầu và acceptance criteria trong kế hoạch làm việc.
2. Thay đổi schema bằng Django model + migration; thêm database constraint khi rule phù hợp.
3. Đặt business rule nhiều bước trong service/domain layer và dùng transaction cho thao tác cần tính nguyên tử.
4. Thêm serializer, permission và API theo `/api/v1/`; không tin role hoặc trạng thái do SPA tự suy diễn.
5. Thêm typed API client, UI states và route/component React cần thiết cho cùng outcome.
6. Xử lý loading, empty, validation và error states phù hợp phạm vi slice.
7. Giữ chatbot ngoài dữ liệu nhạy cảm theo ADR-003.

## Test theo rủi ro

- Viết backend test cho happy path, validation, permission và state transition liên quan.
- Viết frontend test cho hành vi người dùng và guard quan trọng; không chỉ snapshot markup.
- Thêm regression test trước khi sửa bug nếu có thể tái hiện.
- Chạy test hẹp trong lúc phát triển, sau đó chạy toàn bộ suite liên quan.

## Truy vết và bàn giao

Tạo hoặc cập nhật `inception/implementation/<increment-slug>.md` theo mẫu reference. Ghi file thay đổi và bằng chứng lệnh thực tế. Không đánh dấu Acceptance Gate; sau Construction, dùng `$medibook-aidlc-verify` để review độc lập.
