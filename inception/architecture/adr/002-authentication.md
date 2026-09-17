# ADR-002: JWT cho tài khoản nội bộ

## Trạng thái

Chấp nhận

## Bối cảnh

Chỉ Employee và Admin cần đăng nhập. Patient đặt lịch công khai và không cần tài khoản trong MVP. Frontend và backend là hai ứng dụng riêng.

## Quyết định

Dùng Django Authentication kết hợp `djangorestframework-simplejwt`. API nội bộ xác thực bằng Bearer access token và phân quyền theo role `ADMIN`/`EMPLOYEE`.

## Lý do

- Tương thích với Django/DRF.
- Phù hợp kiến trúc frontend/backend tách biệt.
- Có thể kiểm tra permission ở API layer.
- Không mở rộng tài khoản Patient ngoài phạm vi MVP.

## Hệ quả và giới hạn

Phải quản lý hết hạn và refresh token, logout phía client và bảo vệ token khỏi XSS. Nếu triển khai production, cần bổ sung secret management, HTTPS, rotation/revocation và audit log.
