# ADR-007: PostgreSQL và Django ORM

## Trạng thái

Chấp nhận

## Bối cảnh

Hệ thống lưu các entity quan hệ, cần constraint, transaction và truy vấn tổng hợp cho dashboard. Luồng đặt lịch phải tạo/cập nhật Patient và Appointment nhất quán.

## Quyết định

Dùng PostgreSQL làm database duy nhất của MVP; truy cập dữ liệu qua Django ORM và quản lý schema bằng Django Migration. Tạo/cập nhật bệnh nhân cùng lịch hẹn phải nằm trong `transaction.atomic()`.

## Lý do

- Phù hợp dữ liệu quan hệ và constraint nghiệp vụ.
- Tích hợp trực tiếp với Django.
- Hỗ trợ transaction, index và truy vấn tổng hợp.
- Migration được version-control cùng source code.

## Hệ quả

Không sửa schema production thủ công ngoài migration. Constraint quan trọng được đặt ở database khi khả thi, còn rule nhiều bước được xử lý ở service layer. Dữ liệu đã có lịch sử ưu tiên `is_active` hoặc trạng thái nghiệp vụ thay vì hard delete.
