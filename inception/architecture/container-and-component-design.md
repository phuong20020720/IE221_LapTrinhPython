# Container và Component Design

## Containers

| Container | Công nghệ | Trách nhiệm |
|---|---|---|
| Web SPA | React/Vite/TypeScript | Public routes, đăng nhập và protected admin routes trong một ứng dụng |
| REST API | Django/DRF | Auth, validation, nghiệp vụ, serializer và permission |
| Database | PostgreSQL | Dữ liệu nghiệp vụ và tài khoản |
| Mailpit | Mailpit SMTP/Web UI | Nhận và hiển thị email xác nhận trong local/test; không chuyển phát ra Internet |
| Chatbot Boundary | Django module hoặc service adapter | Giới hạn nguồn dữ liệu, safety response, gọi knowledge provider |

## Frontend modules

```text
frontend/src/
├── app/                # Router, providers, route guards
├── features/
│   ├── auth/
│   ├── doctors/
│   ├── specialties/
│   ├── appointments/
│   ├── patients/
│   ├── dashboard/
│   └── chatbot/
├── pages/              # Public pages và admin pages
├── shared/             # UI, API client, types, utilities
└── main.tsx
```

Public routes gồm `/`, `/doctors`, `/doctors/:id` và `/booking`; protected routes nằm dưới `/admin/*`. React Router chịu trách nhiệm điều hướng phía client. Không có route tra cứu lịch công khai theo ADR-010.

## Backend modules

```text
backend/
└── apps/
    ├── accounts/       # User, role, JWT, permissions
    ├── specialties/    # Chuyên khoa
    ├── doctors/        # Bác sĩ và expertise
    ├── patients/       # Hồ sơ bệnh nhân
    ├── appointments/   # Đặt lịch và state transition
    ├── dashboard/      # Số liệu tổng hợp
    └── chatbot/        # Boundary, safety, approved knowledge
```

## Quy tắc phụ thuộc

- View/API gọi service; service gọi model/repository và domain validation.
- `appointments` có thể tham chiếu `patients`, `doctors`, `specialties`, `accounts`.
- Module chatbot không phụ thuộc trực tiếp vào model `Patient` hoặc nội dung riêng tư của `Appointment`.
- Dashboard chỉ đọc qua query/service tối ưu; không chứa business rule tạo lịch.
- Backend gửi email qua abstraction của Django và cấu hình SMTP bằng biến môi trường. Local dùng `mailpit:1025`; production phải dùng SMTP/provider thật.
- Frontend gọi API qua typed client, không suy diễn trạng thái nghiệp vụ ở client.
- Route guard kiểm tra phiên đăng nhập để điều hướng; mọi quyền truy cập vẫn được DRF permission kiểm tra lại.

## Transaction boundary

Tạo bệnh nhân và lịch hẹn phải nằm trong `transaction.atomic()`. Chuyển trạng thái lịch hẹn phải kiểm tra trạng thái hiện tại, quyền người dùng và điều kiện bác sĩ trước khi ghi.

Email xác nhận chỉ được gửi sau khi transaction tạo lịch hẹn đã commit thành công để tránh gửi thông tin cho một lịch bị rollback.
