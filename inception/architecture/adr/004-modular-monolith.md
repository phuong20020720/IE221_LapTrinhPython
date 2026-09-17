# ADR-004: Backend modular monolith

## Trạng thái

Chấp nhận

## Bối cảnh

MVP có một nhóm phát triển, một database và các domain liên quan chặt chẽ. Microservice sẽ làm tăng chi phí triển khai, quan sát và xử lý transaction mà chưa mang lại lợi ích tương xứng.

## Quyết định

Xây dựng một Django/DRF backend theo modular monolith. Các module `accounts`, `specialties`, `doctors`, `patients`, `appointments`, `dashboard` và `chatbot` cùng chạy trong một process triển khai nhưng có ranh giới trách nhiệm rõ ràng.

## Lý do

- Phù hợp quy mô MVP và năng lực vận hành hiện tại.
- Giữ transaction đặt lịch trong một database.
- Dễ chạy local, test và triển khai.
- Vẫn cho phép tách service sau này nếu có nhu cầu thực tế.

## Hệ quả

Module không được truy cập tùy tiện internals của nhau; giao tiếp qua service/query layer đã định nghĩa. Database dùng chung nên migration phải được review. Việc tách microservice chỉ được thực hiện bằng ADR mới dựa trên yêu cầu scale hoặc ownership cụ thể.
