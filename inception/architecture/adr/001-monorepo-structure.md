# ADR-001: Chọn cấu trúc monorepo

## Trạng thái

Chấp nhận

## Bối cảnh

MediBook có backend Django và frontend React SPA nhưng cùng thuộc một MVP, cùng cần tài liệu, cấu hình local và quy trình test thống nhất.

## Quyết định

Dùng một repository với `backend/`, `frontend/`, `inception/` và các file cấu hình dùng chung ở root.

## Lý do

- Dễ đồng bộ API contract và business rule.
- Phù hợp quy mô nhóm/đồ án.
- Dễ chạy local bằng Docker Compose và review một Pull Request.
- Giảm overhead quản lý nhiều repository.

## Hệ quả

Backend và frontend vẫn có dependency, formatter và README riêng. Không để code hai phía phụ thuộc ngầm; contract phải được ghi trong `inception/architecture/api-contract.md`.
