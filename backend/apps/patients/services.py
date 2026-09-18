from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError

from apps.patients.models import Patient
from apps.patients.phone import normalize_phone


def get_patient(*, patient_id: int) -> Patient:
    try:
        return Patient.objects.get(pk=patient_id)
    except Patient.DoesNotExist as exc:
        raise NotFound("Không tìm thấy bệnh nhân.") from exc


def search_patients(*, query: str = "", include_inactive: bool = False):
    queryset = Patient.objects.all().order_by("full_name", "id")
    if not include_inactive:
        queryset = queryset.filter(is_active=True)

    cleaned = query.strip()
    if not cleaned:
        return queryset

    filters = Q(full_name__icontains=cleaned)
    try:
        normalized = normalize_phone(cleaned)
        filters |= Q(phone=normalized) | Q(phone__icontains=cleaned)
    except ValidationError:
        filters |= Q(phone__icontains=cleaned)

    return queryset.filter(filters)


@transaction.atomic
def create_patient(
    *,
    full_name: str,
    phone: str,
    email: str = "",
    is_active: bool = True,
) -> Patient:
    normalized_name = full_name.strip()
    if not normalized_name:
        raise ValidationError({"full_name": "Họ tên là bắt buộc."})

    normalized_phone = normalize_phone(phone)
    if Patient.objects.filter(phone=normalized_phone).exists():
        raise ValidationError({"phone": "Số điện thoại đã tồn tại."})

    normalized_email = (email or "").strip()
    return Patient.objects.create(
        full_name=normalized_name,
        phone=normalized_phone,
        email=normalized_email,
        is_active=is_active,
    )


@transaction.atomic
def update_patient(
    *,
    patient_id: int,
    full_name: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    is_active: bool | None = None,
) -> Patient:
    patient = get_patient(patient_id=patient_id)

    if full_name is not None:
        normalized_name = full_name.strip()
        if not normalized_name:
            raise ValidationError({"full_name": "Họ tên không được để trống."})
        patient.full_name = normalized_name

    if phone is not None:
        normalized_phone = normalize_phone(phone)
        if (
            Patient.objects.filter(phone=normalized_phone)
            .exclude(pk=patient.pk)
            .exists()
        ):
            raise ValidationError({"phone": "Số điện thoại đã tồn tại."})
        patient.phone = normalized_phone

    # Không ghi đè dữ liệu hiện có bằng giá trị rỗng.
    if email is not None:
        normalized_email = email.strip()
        if normalized_email:
            patient.email = normalized_email

    if is_active is not None:
        patient.is_active = is_active

    patient.save()
    return patient


@transaction.atomic
def deactivate_patient(*, patient_id: int) -> Patient:
    patient = get_patient(patient_id=patient_id)
    patient.is_active = False
    patient.save(update_fields=["is_active", "updated_at"])
    return patient


def _fill_blank_patient_fields(
    patient: Patient,
    *,
    full_name: str,
    email: str,
) -> Patient:
    """Chỉ bổ sung field đang trống; không ghi đè giá trị hiện có bằng rỗng/khác."""
    changed = False
    normalized_name = full_name.strip()
    if normalized_name and not patient.full_name:
        patient.full_name = normalized_name
        changed = True

    normalized_email = email.strip()
    if normalized_email and not patient.email:
        patient.email = normalized_email
        changed = True

    if changed:
        patient.save()
    return patient


@transaction.atomic
def get_or_create_patient_by_phone(
    *,
    full_name: str,
    phone: str,
    email: str = "",
) -> tuple[Patient, bool]:
    """
    Service ổn định cho luồng đặt lịch (Developer 4).

    - Chuẩn hóa số điện thoại trước khi tìm/tạo.
    - Tái sử dụng bệnh nhân nếu SĐT đã tồn tại.
    - Không ghi đè họ tên/email hiện có bằng giá trị rỗng.
    - An toàn khi gọi trong `transaction.atomic()` bên ngoài.
    - Chịu race tạo trùng SĐT bằng cách bắt IntegrityError rồi lấy lại bản ghi.
    """
    normalized_name = full_name.strip()
    if not normalized_name:
        raise ValidationError({"full_name": "Họ tên là bắt buộc."})

    normalized_phone = normalize_phone(phone)
    normalized_email = (email or "").strip()

    existing = Patient.objects.filter(phone=normalized_phone).first()
    if existing is not None:
        return (
            _fill_blank_patient_fields(
                existing,
                full_name=normalized_name,
                email=normalized_email,
            ),
            False,
        )

    try:
        # Savepoint: IntegrityError không làm hỏng transaction ngoài (đặt lịch).
        with transaction.atomic():
            patient = Patient.objects.create(
                full_name=normalized_name,
                phone=normalized_phone,
                email=normalized_email,
                is_active=True,
            )
        return patient, True
    except IntegrityError:
        raced = Patient.objects.get(phone=normalized_phone)
        return (
            _fill_blank_patient_fields(
                raced,
                full_name=normalized_name,
                email=normalized_email,
            ),
            False,
        )
