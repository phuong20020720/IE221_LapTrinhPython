# ADR-008: Môi trường local bằng Docker Compose

## Trạng thái

Chấp nhận

## Bối cảnh

Dự án gồm SPA, REST API và PostgreSQL. Nhóm cần môi trường chạy nhất quán, dễ khởi tạo và không phụ thuộc cấu hình PostgreSQL cài trực tiếp trên máy.

## Quyết định

Dùng Docker Compose ở repository root với ba service `frontend`, `backend` và `db`. Cấu hình không nhạy cảm được mô tả trong `.env.example`; secret và file `.env` không được commit.

## Lý do

- Đồng nhất môi trường phát triển giữa các thành viên.
- Một lệnh có thể khởi động toàn bộ hệ thống.
- Cô lập phiên bản runtime và PostgreSQL.
- Tạo nền tảng cho CI và deployment sau này.

## Hệ quả

Mỗi ứng dụng vẫn có thể chạy trực tiếp để debug nhanh, nhưng Compose là đường chạy local chuẩn. Backend phải đợi database healthy trước migration/startup; frontend đọc API base URL qua environment. Thiết kế production, reverse proxy, HTTPS và managed database nằm ngoài ADR này và sẽ được quyết định khi có môi trường triển khai cụ thể.
