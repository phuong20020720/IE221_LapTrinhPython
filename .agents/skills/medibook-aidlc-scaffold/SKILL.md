---
name: medibook-aidlc-scaffold
description: Dựng hoặc hoàn thiện source base và walking skeleton MediBook từ các ADR đã chấp nhận. Dùng khi tạo backend Django/DRF, React/Vite SPA, PostgreSQL, Docker Compose, health check, route public/admin, cấu hình môi trường và kiểm tra khởi động ban đầu.
---

# Dựng source base MediBook

Tuân theo yêu cầu trực tiếp của người dùng trước các mặc định trong skill.

## Điều kiện đầu vào

1. Đọc `AGENTS.md`, `git status` và cây file hiện tại.
2. Đọc toàn bộ `inception/architecture/` và các ADR-001, ADR-004 đến ADR-008.
3. Đọc `inception/plainning/kế-hoạch-dự-án.md` để giữ đúng phạm vi MVP.
4. Đọc [references/walking-skeleton.md](references/walking-skeleton.md).
5. Nếu ADR nền tảng chưa được chấp nhận hoặc tài liệu còn mâu thuẫn, dừng ở Architecture Gate và báo chính xác điểm cần quyết định.

## Thực hiện

1. Lập kế hoạch ngắn, bảo toàn mọi thay đổi sẵn có của người dùng.
2. Tạo monorepo với `backend/`, `frontend/` và cấu hình root; không di chuyển tài liệu inception nếu không được yêu cầu.
3. Dựng Django/DRF modular monolith với settings theo environment, custom User trước migration đầu tiên và các app domain theo architecture.
4. Dựng một React/Vite/TypeScript SPA với React Router, public routes và protected `/admin/*` routes.
5. Thêm PostgreSQL và ba service `db`, `backend`, `frontend` trong Docker Compose.
6. Thêm `.env.example`, `.gitignore`, health endpoint và API client base URL; không tạo hoặc commit secret thật.
7. Chỉ tạo walking skeleton. Không tự triển khai toàn bộ CRUD hoặc business feature khi chưa được yêu cầu.

## Kiểm chứng

- Cài dependency bằng lockfile phù hợp nếu môi trường cho phép.
- Chạy Django system check và test nền.
- Chạy TypeScript check, lint/test và production build của SPA.
- Validate Docker Compose nếu Docker khả dụng.
- Gọi health endpoint hoặc thực hiện smoke test tương đương khi có thể chạy service.
- Không tuyên bố lệnh đạt nếu chưa chạy; ghi rõ lệnh bị chặn và nguyên nhân.

## Gate và bàn giao

Cập nhật `inception/aidlc-state.md` với file đã tạo, lệnh đã chạy và kết quả. Chỉ đưa Construction Gate sang `passed` khi definition of done trong reference đạt. Sau đó định tuyến sang `$medibook-aidlc-verify` trước khi triển khai feature đầu tiên.
