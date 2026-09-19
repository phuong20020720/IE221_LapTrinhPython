# MediBook

MediBook là hệ thống đặt lịch khám gồm React/Vite SPA, Django/DRF modular monolith, PostgreSQL và Mailpit chạy bằng Docker Compose.

## Chạy toàn bộ hệ thống

Yêu cầu: Docker Desktop có Docker Compose.

```powershell
docker compose up --build -d
docker compose ps
```

Các service:

- Frontend: <http://localhost:5174>
- Backend health: <http://localhost:8000/api/v1/health/>
- PostgreSQL: `localhost:5433`
- Mailpit (xem email local): <http://localhost:8025>

Backend tự chạy migration sau khi PostgreSQL healthy. Để khởi tạo/kiểm tra database riêng:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-db.ps1
```

Trên macOS/Linux dùng `sh scripts/init-db.sh`.

Tạo hoặc làm mới bộ dữ liệu demo (có thể chạy lại an toàn):

```powershell
docker compose exec -T backend python manage.py seed_demo
```

Bộ seed gồm 10 chuyên khoa, 20 bác sĩ với chân dung AI hư cấu, 100 bệnh nhân,
10 nhân viên và 72 lịch hẹn trải trên 30 ngày gần nhất cùng tuần kế tiếp. Tài khoản
nhân viên là `employee01` đến `employee10`, cùng mật khẩu local `Demo@123456`.
Toàn bộ tên, số điện thoại và email trong bộ seed là dữ liệu giả lập.

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
backend/demo_assets/doctors Chân dung AI hư cấu dùng cho seed demo
frontend/                   React/Vite SPA
frontend/src/assets/images  Ảnh được import từ source
database/init/              SQL chạy khi volume PostgreSQL được tạo
scripts/                    Script khởi tạo database
inception/                  Planning, architecture, ADR và AI-DLC state
```

Sao chép `.env.example` thành `.env` khi cần đổi port hoặc credential local. Không commit `.env`, secret thật hoặc dữ liệu bệnh nhân.
