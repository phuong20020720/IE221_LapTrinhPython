# Accounts, Authentication và Patients

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#2.2-employee`, `#6-quy-tắc-dữ-liệu-bệnh-nhân`, `#12-đăng-nhập-và-phân-quyền`
- Architecture: `inception/architecture/api-contract.md`, `inception/architecture/security-and-permission-model.md`
- ADR: `ADR-002`

## Acceptance criteria

- [x] Custom `User` với role `ADMIN`/`EMPLOYEE`, JWT login/refresh/`me`, permission kiểm tra ở backend
- [x] Admin CRUD tài khoản Employee (xóa = soft deactivate)
- [x] Patient model + migration; chuẩn hóa SĐT; CRUD và tìm kiếm theo tên/SĐT
- [x] SPA: login/logout/refresh, protected routes, UI Patients và Employees
- [x] Backend/frontend tests cho auth, permission và hành vi chính
- [x] `get_or_create_patient_by_phone` ổn định cho transaction đặt lịch (atomic, IntegrityError, không ghi đè rỗng)
- [x] PostgreSQL local có tài khoản Admin `adminmedicare`; mật khẩu chỉ được đặt trực tiếp trong database

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | `accounts/migrations/0002_user_role_constraint.py`, `patients/migrations/0001_initial.py` | CheckConstraint role; bảng `patients` |
| Backend | `apps/accounts/*`, `apps/patients/*`, `config/urls.py` | JWT, Employee CRUD, Patient CRUD/search, phone normalize |
| Booking hook | `apps.patients.services.get_or_create_patient_by_phone` | Dev 4 gọi trong `transaction.atomic()` khi tạo lịch |
| Frontend | `features/auth`, `shared/api/{auth,patients,employees}.ts`, pages/admin routes | Auth session, protected/role routes, quản lý UI |
| Tests | `accounts/tests`, `patients/tests`, `App.auth.test.tsx` | API permission/validation, get_or_create + race |

## Contract cho Developer 4 (Appointments)

```python
from django.db import transaction
from apps.patients.services import get_or_create_patient_by_phone

with transaction.atomic():
    patient, created = get_or_create_patient_by_phone(
        full_name=payload["full_name"],
        phone=payload["phone"],
        email=payload.get("email", ""),
    )
    # tiếp tục tạo Appointment gắn patient.id
```

## Evidence

| Command/check | Result |
|---|---|
| `MEDIBOOK_USE_SQLITE=1 python manage.py test apps.patients` | passed (12 tests, gồm get_or_create + IntegrityError) |
| `docker compose run --rm -T backend python manage.py migrate --noinput` | passed; áp dụng migration còn thiếu |
| Django `authenticate()` cho `adminmedicare` | passed; role `ADMIN`, active/staff/superuser, mật khẩu đã hash |

## Open items

- Dashboard số liệu và Appointments không thuộc increment này.
- Production vẫn dùng PostgreSQL qua Docker Compose; `MEDIBOOK_USE_SQLITE` chỉ hỗ trợ kiểm thử khi thiếu Docker.
