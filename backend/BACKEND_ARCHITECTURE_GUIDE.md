# Hướng dẫn kiến trúc Backend MediBook

Tài liệu này dành cho người mới với Python/Django. Backend hiện là **modular monolith**: một Django process và một PostgreSQL database, nhưng code được chia theo domain như `accounts`, `doctors`, `appointments`.

## 1. Luồng xử lý một request

```text
React SPA
→ URL route
→ View (HTTP)
→ Serializer (DTO + validation)
→ Service (business logic + transaction)
→ Django Model/ORM
→ PostgreSQL
→ Serializer output
→ JSON response
```

Mỗi lớp có một trách nhiệm. Không đặt toàn bộ validation, query và nghiệp vụ vào `views.py`.

## 2. Cấu trúc thư mục

```text
backend/
├── manage.py                 # CLI của Django
├── requirements.txt          # Python dependencies
├── Dockerfile
├── config/                   # Cấu hình toàn hệ thống
│   ├── settings.py           # Apps, DB, JWT, CORS, timezone
│   ├── urls.py               # Root URL router
│   ├── views.py              # Chỉ chứa health check dùng chung
│   ├── asgi.py               # Entry point ASGI
│   └── wsgi.py               # Entry point WSGI
└── apps/                     # Các module nghiệp vụ
    ├── accounts/
    ├── specialties/
    ├── doctors/
    ├── patients/
    ├── appointments/
    ├── dashboard/
    └── chatbot/
```

Khi triển khai một app, nên có:

```text
appointments/
├── __init__.py
├── apps.py
├── models.py
├── serializers.py
├── services.py
├── permissions.py
├── views.py
├── urls.py
├── tests/
│   ├── __init__.py
│   ├── test_services.py
│   └── test_api.py
└── migrations/
    └── __init__.py
```

### `__init__.py` dùng để làm gì?

`__init__.py` đánh dấu thư mục là một Python package để có thể import:

```python
from apps.accounts.models import User
```

File này thường để trống. Không đặt business logic hoặc import hàng loạt model vào đây vì dễ tạo circular import.

### `apps.py` dùng để làm gì?

`AppConfig` cung cấp metadata để Django nhận diện module:

```python
class SpecialtiesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.specialties"
```

Sau đó app phải xuất hiện trong `INSTALLED_APPS` của `config/settings.py`.

## 3. Kết nối PostgreSQL

`config/settings.py` đọc thông tin DB từ biến môi trường:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DATABASE_NAME", "medibook"),
        "USER": os.getenv("DATABASE_USER", "medibook"),
        "PASSWORD": os.getenv("DATABASE_PASSWORD", "medibook_dev"),
        "HOST": os.getenv("DATABASE_HOST", "127.0.0.1"),
        "PORT": os.getenv("DATABASE_PORT", "5433"),
    }
}
```

Có hai trường hợp cần phân biệt:

| Backend chạy ở đâu | DB host | DB port |
|---|---|---|
| Backend trong Docker Compose | `db` | `5432` |
| Backend chạy trực tiếp trên máy | `127.0.0.1` | `5433` |

Trong Docker, các container gọi nhau bằng **service name**, nên backend dùng host `db`. Port `5433` chỉ là cổng được mở ra máy host.

Kiểm tra kết nối:

```powershell
docker compose exec -T backend python manage.py check
curl http://localhost:8000/api/v1/health/
```

Health endpoint thực hiện `SELECT 1`; nếu nhận `"database": "connected"`, Django đã giao tiếp được với PostgreSQL.

## 4. Model và migration

Model là biểu diễn Python của bảng database:

```python
from django.db import models


class Specialty(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name
```

Quy ước:

- Tên class dùng `PascalCase`; field và biến dùng `snake_case`.
- Dùng constraint ở DB cho điều kiện luôn phải đúng như `unique=True`.
- `blank=True` liên quan validation; `null=True` cho phép SQL `NULL`. Không tùy tiện dùng cả hai cho chuỗi.
- Model giữ cấu trúc dữ liệu và hành vi nhỏ của chính entity. Nghiệp vụ nhiều bước đặt trong service.

Sau khi sửa model:

```powershell
docker compose exec -T backend python manage.py makemigrations
docker compose exec -T backend python manage.py migrate
docker compose exec -T backend python manage.py makemigrations --check --dry-run
```

Không sửa database thủ công. Mọi thay đổi schema phải đi qua migration và được commit.

## 5. DTO trong Django REST Framework

DRF không thường gọi là DTO; vai trò này do **Serializer** đảm nhiệm. Serializer:

- nhận JSON và validate input;
- chuyển dữ liệu Python thành JSON output;
- không nên chứa business logic nhiều bước.

Nên tách input/output khi hai cấu trúc khác nhau:

```python
from rest_framework import serializers

from apps.specialties.models import Specialty


class CreateSpecialtyInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    description = serializers.CharField(required=False, allow_blank=True)


class SpecialtyOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ["id", "name", "description", "is_active", "created_at"]
```

Validation phụ thuộc một field có thể viết bằng `validate_name()`. Validation kết hợp nhiều field viết trong `validate()`. Rule nghiệp vụ cần query hoặc transaction nên để trong service.

## 6. Service và business logic

Service là hàm thực hiện một use case:

```python
from django.db import transaction

from apps.specialties.models import Specialty


@transaction.atomic
def create_specialty(*, name: str, description: str = "") -> Specialty:
    normalized_name = name.strip()
    if Specialty.objects.filter(name__iexact=normalized_name).exists():
        raise ValueError("Chuyên khoa đã tồn tại.")

    return Specialty.objects.create(
        name=normalized_name,
        description=description.strip(),
    )
```

Dùng keyword-only arguments (`*`) để lời gọi rõ nghĩa. Dùng `transaction.atomic` khi use case ghi nhiều bảng hoặc phải rollback toàn bộ nếu một bước lỗi.

Với quy mô MVP, service có thể gọi Django ORM trực tiếp. Không cần tạo generic repository chỉ để bọc lại `Model.objects`.

## 7. Viết API

View chỉ xử lý HTTP: đọc request, gọi serializer/service và trả response.

```python
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.specialties.serializers import (
    CreateSpecialtyInputSerializer,
    SpecialtyOutputSerializer,
)
from apps.specialties.services import create_specialty


class SpecialtyListCreateApi(APIView):
    def post(self, request):
        input_serializer = CreateSpecialtyInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        specialty = create_specialty(**input_serializer.validated_data)
        output_serializer = SpecialtyOutputSerializer(specialty)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
```

Khai báo URL trong app:

```python
# apps/specialties/urls.py
from django.urls import path

from apps.specialties.views import SpecialtyListCreateApi

urlpatterns = [
    path("", SpecialtyListCreateApi.as_view(), name="specialty-list-create"),
]
```

Sau đó mount ở root:

```python
# config/urls.py
from django.urls import include, path

urlpatterns = [
    path("api/v1/specialties/", include("apps.specialties.urls")),
]
```

## 8. Authentication và permission

Toàn hệ thống mặc định yêu cầu JWT vì `REST_FRAMEWORK` dùng `IsAuthenticated`. Public API phải khai báo rõ `AllowAny`.

Ví dụ permission Admin:

```python
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
```

Gắn vào view bằng `permission_classes = [IsAdminRole]`. Không tin `role` do frontend gửi lên; role phải lấy từ user đã xác thực.

JWT hiện có:

```text
POST /api/v1/auth/token/
POST /api/v1/auth/token/refresh/
```

## 9. Xử lý lỗi

- Input sai: Serializer trả HTTP `400`.
- Chưa đăng nhập: `401`.
- Không đủ quyền: `403`.
- Không tồn tại: `404`.
- Tạo thành công: `201`; đọc/cập nhật thành công: `200`.

Không dùng `except Exception` rồi trả `200`. Với lỗi nghiệp vụ, nên định nghĩa exception riêng hoặc chuyển lỗi service thành DRF `ValidationError` tại API boundary.

## 10. Kiểm thử

Tách test theo lớp:

- `test_services.py`: kiểm tra business rule và transaction.
- `test_api.py`: kiểm tra status code, JSON, authentication và permission.
- Model constraint quan trọng cần test riêng.

Ví dụ API test:

```python
from rest_framework.test import APITestCase


class SpecialtyApiTests(APITestCase):
    def test_anonymous_user_cannot_create_specialty(self):
        response = self.client.post(
            "/api/v1/specialties/",
            {"name": "Tim mạch"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
```

Chạy test:

```powershell
docker compose exec -T backend python manage.py test
```

## 11. Quy trình thêm một API mới

1. Đọc business rule, database design, API contract và ADR liên quan.
2. Tạo/sửa model và migration.
3. Viết serializer input/output.
4. Viết service cho use case.
5. Viết permission nếu endpoint nội bộ.
6. Viết view và URL.
7. Viết service test và API test.
8. Chạy `check`, migration check và toàn bộ test.
9. Chỉ sau đó mới nối frontend.

## 12. Các lỗi nên tránh

- Query database trực tiếp khắp `views.py`.
- Đặt business rule ở frontend nhưng backend không kiểm tra lại.
- Sửa file migration đã dùng ở môi trường chung; hãy tạo migration mới.
- Import model vòng tròn giữa các app.
- Lưu password dạng text hoặc commit `.env`.
- Dùng raw SQL khi Django ORM đã giải quyết được; health check là ngoại lệ đơn giản.
- Tạo model Patient/Appointment trong app `accounts`; mỗi domain phải đúng ranh giới của nó.

Khi chưa rõ code nên đặt ở đâu, dùng nguyên tắc: **HTTP ở view, hình dạng dữ liệu ở serializer, nghiệp vụ ở service, lưu trữ ở model/ORM, quyền ở permission**.
