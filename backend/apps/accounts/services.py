from django.db import transaction
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.accounts.models import User


def _compose_full_name(*, first_name: str, last_name: str) -> str:
    # Tiếng Việt: Họ (last_name) + Tên (first_name)
    return f"{last_name.strip()} {first_name.strip()}".strip()


def _get_employee(*, employee_id: int) -> User:
    try:
        return User.objects.get(pk=employee_id, role=User.Role.EMPLOYEE)
    except User.DoesNotExist as exc:
        raise NotFound("Không tìm thấy tài khoản Employee.") from exc


def list_employees(*, include_inactive: bool = False):
    queryset = User.objects.filter(role=User.Role.EMPLOYEE).order_by("username")
    if not include_inactive:
        queryset = queryset.filter(is_active=True)
    return queryset


@transaction.atomic
def create_employee(
    *,
    username: str,
    first_name: str,
    last_name: str,
    password: str,
    is_active: bool = True,
) -> User:
    normalized_username = username.strip()
    normalized_first = first_name.strip()
    normalized_last = last_name.strip()
    if not normalized_username:
        raise ValidationError({"username": "Tên đăng nhập là bắt buộc."})
    if not normalized_last:
        raise ValidationError({"last_name": "Họ là bắt buộc."})
    if not normalized_first:
        raise ValidationError({"first_name": "Tên là bắt buộc."})
    if User.objects.filter(username__iexact=normalized_username).exists():
        raise ValidationError({"username": "Tên đăng nhập đã tồn tại."})

    full_name = _compose_full_name(
        first_name=normalized_first,
        last_name=normalized_last,
    )
    user = User(
        username=normalized_username,
        first_name=normalized_first,
        last_name=normalized_last,
        full_name=full_name,
        role=User.Role.EMPLOYEE,
        is_active=is_active,
        is_staff=False,
    )
    user.set_password(password)
    user.save()
    return user


@transaction.atomic
def update_employee(
    *,
    employee_id: int,
    first_name: str | None = None,
    last_name: str | None = None,
    password: str | None = None,
    is_active: bool | None = None,
) -> User:
    employee = _get_employee(employee_id=employee_id)

    if first_name is not None or last_name is not None:
        if first_name is None or last_name is None:
            raise ValidationError("Cần gửi đồng thời first_name và last_name.")
        normalized_first = first_name.strip()
        normalized_last = last_name.strip()
        if not normalized_last:
            raise ValidationError({"last_name": "Họ không được để trống."})
        if not normalized_first:
            raise ValidationError({"first_name": "Tên không được để trống."})
        employee.first_name = normalized_first
        employee.last_name = normalized_last
        employee.full_name = _compose_full_name(
            first_name=normalized_first,
            last_name=normalized_last,
        )

    if password is not None:
        employee.set_password(password)

    if is_active is not None:
        employee.is_active = is_active

    employee.save()
    return employee


@transaction.atomic
def deactivate_employee(*, employee_id: int, actor: User) -> User:
    if actor.id == employee_id:
        raise PermissionDenied("Không thể vô hiệu hóa tài khoản đang đăng nhập.")
    employee = _get_employee(employee_id=employee_id)
    employee.is_active = False
    employee.save(update_fields=["is_active", "updated_at"])
    return employee


def get_employee(*, employee_id: int) -> User:
    return _get_employee(employee_id=employee_id)
