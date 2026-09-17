# Definition of Done cho source base

## Cấu trúc tối thiểu

```text
backend/
frontend/
compose.yaml
.env.example
.gitignore
README.md
```

Backend tối thiểu có project config, `apps/accounts`, các package domain rỗng hợp lệ, custom User, DRF, JWT wiring, CORS allowlist, health endpoint và test health. Không tạo migration trước khi `AUTH_USER_MODEL` được cấu hình.

Frontend tối thiểu có Vite + React + TypeScript, React Router, layout public, login route, protected admin layout, API client và test render/smoke. Route guard không thay thế permission backend.

Compose tối thiểu có health check cho PostgreSQL, dependency có điều kiện cho backend, volume database và environment qua biến. Không hard-code credential production.

## Bằng chứng hoàn thành

- Backend system check đạt.
- Backend tests đạt.
- Frontend typecheck và build đạt.
- Frontend tests đạt nếu test runner đã cấu hình.
- Compose config hợp lệ nếu Docker có sẵn.
- README có lệnh chạy thực tế, không phải lệnh dự kiến.

Một service chưa chạy được vì thiếu công cụ ngoài máy có thể được ghi `blocked`, nhưng không được đánh dấu gate `passed`.
