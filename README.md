# MediBook

MediBook là source base cho hệ thống đặt lịch khám: một React/Vite SPA, một Django/DRF modular monolith và PostgreSQL chạy bằng Docker Compose. Increment hiện tại chỉ dựng nền tảng; chưa triển khai chức năng nghiệp vụ.

## Chạy toàn bộ hệ thống

Yêu cầu: Docker Desktop có Docker Compose.

```powershell
docker compose up --build -d
docker compose ps
```

Các service:

- Frontend: <http://localhost:5173>
- Backend health: <http://localhost:8000/api/v1/health/>
- PostgreSQL: `localhost:5433`

Backend tự chạy migration sau khi PostgreSQL healthy. Để khởi tạo/kiểm tra database riêng:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-db.ps1
```

Trên macOS/Linux dùng `sh scripts/init-db.sh`.

Dừng container nhưng giữ dữ liệu:

```powershell
docker compose down
```

## Kiểm tra

```powershell
docker compose exec -T backend python manage.py check
docker compose exec -T backend python manage.py makemigrations --check --dry-run
docker compose exec -T backend python manage.py test

cd frontend
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## Cấu trúc chính

```text
backend/                    Django/DRF và các domain module
frontend/                   React/Vite SPA
frontend/src/assets/images  Ảnh được import từ source
database/init/              SQL chạy khi volume PostgreSQL được tạo
scripts/                    Script khởi tạo database
inception/                  Planning, architecture, ADR và AI-DLC state
```

Sao chép `.env.example` thành `.env` khi cần đổi port hoặc credential local. Không commit `.env`, secret thật hoặc dữ liệu bệnh nhân.
