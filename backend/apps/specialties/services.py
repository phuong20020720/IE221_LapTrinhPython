from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.exceptions import APIException, NotFound, ValidationError

from apps.specialties.models import Specialty


class Conflict(APIException):
    """Biểu diễn xung đột nghiệp vụ bằng HTTP 409."""

    status_code = 409
    default_code = "conflict"


def list_public_specialties(*, query: str = ""):
    """Trả danh sách chuyên khoa hoạt động cho khu vực công khai."""
    queryset = Specialty.objects.filter(is_active=True)
    cleaned = query.strip()
    if cleaned:
        queryset = queryset.filter(name__icontains=cleaned)
    return queryset.order_by("name", "id")


def list_admin_specialties(
    *,
    query: str = "",
    include_inactive: bool = True,
    is_active: bool | None = None,
):
    """Trả danh sách chuyên khoa cho màn hình quản trị."""
    queryset = Specialty.objects.all()
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    elif not include_inactive:
        queryset = queryset.filter(is_active=True)
    cleaned = query.strip()
    if cleaned:
        queryset = queryset.filter(
            Q(name__icontains=cleaned) | Q(description__icontains=cleaned)
        )
    return queryset.order_by("name", "id")


def get_public_specialty(*, specialty_id: int) -> Specialty:
    """Lấy chuyên khoa hoạt động hoặc trả về 404 cho public API."""
    try:
        return Specialty.objects.get(pk=specialty_id, is_active=True)
    except Specialty.DoesNotExist as exc:
        raise NotFound("Không tìm thấy chuyên khoa.") from exc


def get_admin_specialty(*, specialty_id: int) -> Specialty:
    """Lấy chuyên khoa bất kể trạng thái cho Admin."""
    try:
        return Specialty.objects.get(pk=specialty_id)
    except Specialty.DoesNotExist as exc:
        raise NotFound("Không tìm thấy chuyên khoa.") from exc


def _normalize_specialty_name(name: str) -> str:
    """Chuẩn hóa và kiểm tra tên chuyên khoa bắt buộc."""
    normalized = name.strip()
    if not normalized:
        raise ValidationError({"name": "Tên chuyên khoa là bắt buộc."})
    return normalized


@transaction.atomic
def create_specialty(
    *,
    name: str,
    description: str = "",
    is_active: bool = True,
) -> Specialty:
    """Tạo chuyên khoa mới với tên duy nhất không phân biệt hoa thường."""
    normalized_name = _normalize_specialty_name(name)
    if Specialty.objects.filter(name_key=normalized_name.casefold()).exists():
        raise ValidationError({"name": "Tên chuyên khoa đã tồn tại."})
    try:
        return Specialty.objects.create(
            name=normalized_name,
            description=description.strip(),
            is_active=is_active,
        )
    except IntegrityError as exc:
        raise ValidationError({"name": "Tên chuyên khoa đã tồn tại."}) from exc


@transaction.atomic
def update_specialty(
    *,
    specialty_id: int,
    name: str | None = None,
    description: str | None = None,
    is_active: bool | None = None,
) -> Specialty:
    """Cập nhật chuyên khoa và bảo vệ ràng buộc tên duy nhất."""
    specialty = get_admin_specialty(specialty_id=specialty_id)
    if name is not None:
        normalized_name = _normalize_specialty_name(name)
        if (
            Specialty.objects.filter(name_key=normalized_name.casefold())
            .exclude(pk=specialty.pk)
            .exists()
        ):
            raise ValidationError({"name": "Tên chuyên khoa đã tồn tại."})
        specialty.name = normalized_name
    if description is not None:
        specialty.description = description.strip()
    if is_active is not None:
        if not is_active and specialty.doctors.filter(is_active=True).exists():
            raise Conflict(
                "Không thể ngừng chuyên khoa khi vẫn còn bác sĩ hoạt động."
            )
        specialty.is_active = is_active
    try:
        specialty.save()
    except IntegrityError as exc:
        raise ValidationError({"name": "Tên chuyên khoa đã tồn tại."}) from exc
    return specialty


@transaction.atomic
def deactivate_specialty(*, specialty_id: int) -> None:
    """Ngừng chuyên khoa nếu không còn bác sĩ đang hoạt động."""
    specialty = get_admin_specialty(specialty_id=specialty_id)
    if specialty.doctors.filter(is_active=True).exists():
        raise Conflict("Không thể ngừng chuyên khoa khi vẫn còn bác sĩ hoạt động.")
    specialty.is_active = False
    specialty.save(update_fields=["is_active", "updated_at"])
