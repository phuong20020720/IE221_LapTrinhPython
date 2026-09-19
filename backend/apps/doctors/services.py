from collections.abc import Iterable

from django.core.files.storage import Storage
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError

from apps.doctors.models import Doctor, DoctorExpertise
from apps.specialties.models import Specialty


def list_public_doctors(*, query: str = "", specialty_id: int | None = None):
    """Trả bác sĩ hoạt động thuộc chuyên khoa hoạt động cho public API."""
    queryset = Doctor.objects.select_related("specialty").prefetch_related(
        "expertises"
    )
    queryset = queryset.filter(is_active=True, specialty__is_active=True)
    cleaned = query.strip()
    if cleaned:
        queryset = queryset.filter(
            Q(full_name__icontains=cleaned)
            | Q(credentials__icontains=cleaned)
            | Q(position__icontains=cleaned)
        )
    if specialty_id is not None:
        queryset = queryset.filter(specialty_id=specialty_id)
    return queryset.order_by("full_name", "id")


def list_admin_doctors(
    *,
    query: str = "",
    specialty_id: int | None = None,
    include_inactive: bool = True,
    is_active: bool | None = None,
):
    """Trả danh sách đầy đủ phục vụ màn hình quản trị bác sĩ."""
    queryset = Doctor.objects.select_related("specialty").prefetch_related(
        "expertises"
    )
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    elif not include_inactive:
        queryset = queryset.filter(is_active=True)
    cleaned = query.strip()
    if cleaned:
        queryset = queryset.filter(
            Q(full_name__icontains=cleaned)
            | Q(phone__icontains=cleaned)
            | Q(email__icontains=cleaned)
        )
    if specialty_id is not None:
        queryset = queryset.filter(specialty_id=specialty_id)
    return queryset.order_by("full_name", "id")


def get_public_doctor(*, doctor_id: int) -> Doctor:
    """Lấy chi tiết bác sĩ được phép hiển thị công khai."""
    try:
        return (
            Doctor.objects.select_related("specialty")
            .prefetch_related("expertises")
            .get(
                pk=doctor_id,
                is_active=True,
                specialty__is_active=True,
            )
        )
    except Doctor.DoesNotExist as exc:
        raise NotFound("Không tìm thấy bác sĩ.") from exc


def get_admin_doctor(*, doctor_id: int) -> Doctor:
    """Lấy chi tiết bác sĩ bất kể trạng thái cho Admin."""
    try:
        return (
            Doctor.objects.select_related("specialty")
            .prefetch_related("expertises")
            .get(pk=doctor_id)
        )
    except Doctor.DoesNotExist as exc:
        raise NotFound("Không tìm thấy bác sĩ.") from exc


def _get_active_specialty(*, specialty_id: int) -> Specialty:
    """Xác thực chuyên khoa tồn tại và đang hoạt động."""
    try:
        return Specialty.objects.get(pk=specialty_id, is_active=True)
    except Specialty.DoesNotExist as exc:
        raise ValidationError(
            {"specialty_id": "Chuyên khoa không tồn tại hoặc đã ngừng hoạt động."}
        ) from exc


def _normalize_required(value: str, *, field: str, message: str) -> str:
    """Trim và kiểm tra một chuỗi bắt buộc."""
    normalized = value.strip()
    if not normalized:
        raise ValidationError({field: message})
    return normalized


def _replace_expertises(
    *,
    doctor: Doctor,
    expertises: Iterable[dict],
) -> None:
    """Thay toàn bộ lĩnh vực chuyên sâu trong transaction hiện tại."""
    doctor.expertises.all().delete()
    records = []
    for item in expertises:
        name = str(item.get("expertise_name", "")).strip()
        if not name:
            raise ValidationError(
                {"expertises": "Tên lĩnh vực chuyên sâu là bắt buộc."}
            )
        records.append(
            DoctorExpertise(
                doctor=doctor,
                expertise_name=name,
                description=str(item.get("description", "")).strip(),
                display_order=item.get("display_order", 0),
            )
        )
    DoctorExpertise.objects.bulk_create(records)


def _schedule_file_delete(*, storage: Storage, name: str) -> None:
    """Chỉ xóa file cũ sau khi transaction database đã commit."""
    if name:
        transaction.on_commit(lambda: storage.delete(name))


@transaction.atomic
def create_doctor(
    *,
    specialty_id: int,
    full_name: str,
    phone: str,
    credentials: str = "",
    position: str = "",
    years_of_experience: int | None = None,
    email: str = "",
    profile_image=None,
    professional_description: str = "",
    is_active: bool = True,
    expertises: list[dict] | None = None,
) -> Doctor:
    """Tạo bác sĩ và các lĩnh vực chuyên sâu trong một transaction."""
    specialty = _get_active_specialty(specialty_id=specialty_id)
    doctor = Doctor.objects.create(
        specialty=specialty,
        full_name=_normalize_required(
            full_name,
            field="full_name",
            message="Họ tên bác sĩ là bắt buộc.",
        ),
        phone=_normalize_required(
            phone,
            field="phone",
            message="Số điện thoại bác sĩ là bắt buộc.",
        ),
        credentials=credentials.strip(),
        position=position.strip(),
        years_of_experience=years_of_experience,
        email=email.strip(),
        profile_image=profile_image,
        professional_description=professional_description.strip(),
        is_active=is_active,
    )
    if expertises is not None:
        _replace_expertises(doctor=doctor, expertises=expertises)
    return get_admin_doctor(doctor_id=doctor.id)


@transaction.atomic
def update_doctor(
    *,
    doctor_id: int,
    specialty_id: int | None = None,
    full_name: str | None = None,
    phone: str | None = None,
    credentials: str | None = None,
    position: str | None = None,
    years_of_experience: int | None = None,
    years_of_experience_provided: bool = False,
    email: str | None = None,
    profile_image=None,
    profile_image_provided: bool = False,
    professional_description: str | None = None,
    is_active: bool | None = None,
    expertises: list[dict] | None = None,
) -> Doctor:
    """Cập nhật bác sĩ, ảnh và expertises theo nguyên tắc atomic."""
    doctor = get_admin_doctor(doctor_id=doctor_id)
    target_specialty = doctor.specialty
    if specialty_id is not None:
        target_specialty = _get_active_specialty(specialty_id=specialty_id)

    # Bác sĩ hoạt động luôn phải thuộc một chuyên khoa đang hoạt động.
    target_is_active = doctor.is_active if is_active is None else is_active
    if target_is_active and not target_specialty.is_active:
        raise ValidationError(
            {"specialty_id": "Không thể kích hoạt bác sĩ trong chuyên khoa đã ngừng."}
        )

    doctor.specialty = target_specialty
    if full_name is not None:
        doctor.full_name = _normalize_required(
            full_name,
            field="full_name",
            message="Họ tên bác sĩ là bắt buộc.",
        )
    if phone is not None:
        doctor.phone = _normalize_required(
            phone,
            field="phone",
            message="Số điện thoại bác sĩ là bắt buộc.",
        )
    if credentials is not None:
        doctor.credentials = credentials.strip()
    if position is not None:
        doctor.position = position.strip()
    if years_of_experience_provided:
        doctor.years_of_experience = years_of_experience
    if email is not None:
        doctor.email = email.strip()
    if professional_description is not None:
        doctor.professional_description = professional_description.strip()
    if is_active is not None:
        doctor.is_active = is_active

    if profile_image_provided:
        old_name = doctor.profile_image.name if doctor.profile_image else ""
        old_storage = doctor.profile_image.storage if doctor.profile_image else None
        doctor.profile_image = profile_image
        if old_storage and old_name:
            _schedule_file_delete(storage=old_storage, name=old_name)

    doctor.save()
    if expertises is not None:
        _replace_expertises(doctor=doctor, expertises=expertises)
    return get_admin_doctor(doctor_id=doctor.id)


@transaction.atomic
def deactivate_doctor(*, doctor_id: int) -> None:
    """Ngừng hoạt động bác sĩ thay vì xóa dữ liệu vật lý."""
    doctor = get_admin_doctor(doctor_id=doctor_id)
    doctor.is_active = False
    doctor.save(update_fields=["is_active", "updated_at"])


@transaction.atomic
def remove_doctor_profile_image(*, doctor_id: int) -> None:
    """Gỡ ảnh đại diện và xóa file sau khi database commit."""
    doctor = get_admin_doctor(doctor_id=doctor_id)
    if not doctor.profile_image:
        return
    old_name = doctor.profile_image.name
    storage = doctor.profile_image.storage
    doctor.profile_image = None
    doctor.save(update_fields=["profile_image", "updated_at"])
    _schedule_file_delete(storage=storage, name=old_name)
