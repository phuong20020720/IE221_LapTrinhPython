# Hướng dẫn đóng góp cho repository

## Cấu trúc dự án

Repository là monorepo gồm `backend/` (Django/DRF), `frontend/` (React/Vite SPA), `database/init/` (PostgreSQL bootstrap) và `scripts/` (tiện ích local). Tài liệu yêu cầu và thiết kế nằm trong `inception/`:

- `kế-hoạch-dự-án.md` — phạm vi, actor, định hướng công nghệ và các giai đoạn triển khai.
- `đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md` — chức năng MVP, phân quyền, kiểm tra dữ liệu và trạng thái lịch hẹn.
- `thiết-kế-database-và-erd.md` — entity PostgreSQL, quan hệ, ràng buộc và index.

Backend chia module trong `backend/apps/`; frontend chia router, pages, shared code và feature trong `frontend/src/`. Lưu ảnh source tại `frontend/src/assets/images/` và import từ component.

## Lệnh build, test và chạy local

- `docker compose up --build -d`: build và chạy SPA, API, PostgreSQL.
- `powershell -ExecutionPolicy Bypass -File .\scripts\init-db.ps1`: khởi tạo DB và chạy migration.
- `docker compose exec -T backend python manage.py test`: chạy backend tests.
- `cd frontend && npm run typecheck && npm run lint && npm test && npm run build`: kiểm tra frontend.

## Quy ước code và đặt tên

Tuân theo stack đã chọn: Python/Django/DRF cho API và React/Vite/TypeScript cho SPA. Dùng formatter, linter tiêu chuẩn và commit kèm cấu hình của chúng. Dùng `snake_case` cho module/hàm Python, `PascalCase` cho component React và model Django; tên domain nên rõ nghĩa và thống nhất với tài liệu như `Patient`, `Doctor`, `Appointment`. Lưu tài liệu và nội dung tiếng Việt dưới dạng UTF-8.

## Quy định kiểm thử

Django test runner kiểm tra backend; Vitest và Testing Library kiểm tra frontend. Mỗi tính năng mới cần test cho validation, permission và hành vi người dùng liên quan. Trước PR, chạy Django check, migration check, backend tests, frontend typecheck/lint/test/build.

## Commit và Pull Request

Git hiện mới có commit `first commit`, nên chưa có quy ước riêng. Dùng câu lệnh ngắn, dạng mệnh lệnh, với prefix nhất quán, ví dụ `feat: thêm model lịch hẹn` hoặc `docs: cập nhật quy tắc MVP`. Pull Request cần mô tả phạm vi thay đổi, liên kết phần tài liệu liên quan, nêu các bước đã kiểm tra và đính kèm ảnh chụp màn hình nếu thay đổi giao diện. Không gộp refactor không liên quan vào PR.

## Bảo mật và ràng buộc nghiệp vụ

Xem dữ liệu bệnh nhân và lịch hẹn là dữ liệu nhạy cảm. Không commit secret, dữ liệu bệnh nhân thật hoặc thông tin xác thực production. Backend phải kiểm tra phân quyền; dùng cơ chế hash mật khẩu của Django và JWT permission theo thiết kế. Chatbot chỉ cung cấp thông tin tham khảo, không chẩn đoán, kê đơn hoặc thay thế tư vấn y tế khẩn cấp.
