import datetime
import uuid

from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.appointments.models import Appointment
from apps.appointments.state import assert_can_transition
from apps.doctors.models import Doctor
from apps.patients.phone import normalize_phone
from apps.patients.services import get_or_create_patient_by_phone
from apps.specialties.models import Specialty


# The clinic only accepts bookings within 90 days from today.
MAX_DAYS_AHEAD = 90

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def paginate(queryset, *, page: int = 1, page_size: int = DEFAULT_PAGE_SIZE) -> dict:
    """Slice a queryset into one page and its metadata.

    Kept in the service layer because the project has no global DRF pagination;
    this stays scoped to appointments and leaves every other list untouched.
    `Paginator.get_page` clamps a non-int or out-of-range page instead of
    raising, so a hostile `?page=` value cannot 500.
    """
    page_size = max(1, min(page_size or DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE))
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    return {
        "results": list(page_obj.object_list),
        "count": paginator.count,
        "page": page_obj.number,
        "page_size": page_size,
        "total_pages": paginator.num_pages,
    }


def _today() -> datetime.date:
    return timezone.localdate()


def resolve_specialty(*, specialty_id: int) -> Specialty:
    specialty = Specialty.objects.filter(pk=specialty_id).first()
    if specialty is None:
        raise ValidationError({"specialty_id": "Chuyên khoa không tồn tại."})
    if not specialty.is_active:
        raise ValidationError({"specialty_id": "Chuyên khoa đã ngừng hoạt động."})
    return specialty


def resolve_doctor(*, doctor_id: int, specialty: Specialty) -> Doctor:
    doctor = Doctor.objects.filter(pk=doctor_id).first()
    if doctor is None:
        raise ValidationError({"doctor_id": "Bác sĩ không tồn tại."})
    if not doctor.is_active:
        raise ValidationError({"doctor_id": "Bác sĩ đã ngừng hoạt động."})
    if not doctor_matches_specialty(doctor=doctor, specialty_id=specialty.pk):
        raise ValidationError(
            {"doctor_id": "Bác sĩ không thuộc chuyên khoa đã chọn."}
        )
    return doctor


def doctor_matches_specialty(*, doctor: Doctor, specialty_id: int) -> bool:
    """The single seam onto the doctor-to-specialty model.

    The ERD gives each doctor exactly one specialty. If that ever becomes a
    many-to-many relation, this function is the only thing that changes.
    """
    return doctor.specialty_id == specialty_id


def validate_appointment_date(*, appointment_date: datetime.date) -> datetime.date:
    today = _today()
    if appointment_date < today:
        raise ValidationError(
            {"appointment_date": "Ngày khám không được ở trong quá khứ."}
        )
    if appointment_date > today + datetime.timedelta(days=MAX_DAYS_AHEAD):
        raise ValidationError(
            {
                "appointment_date": (
                    f"Chỉ nhận lịch trong vòng {MAX_DAYS_AHEAD} ngày kể từ hôm nay."
                )
            }
        )
    return appointment_date


def validate_session(*, session: str) -> str:
    if session not in Appointment.Session.values:
        raise ValidationError({"session": "Buổi khám phải là MORNING hoặc AFTERNOON."})
    return session


@transaction.atomic
def create_appointment(
    *,
    full_name: str,
    phone: str,
    email: str = "",
    specialty_id: int,
    doctor_id: int | None = None,
    appointment_date: datetime.date,
    session: str,
    reason: str,
) -> Appointment:
    """Create the patient if needed and the appointment in one transaction."""
    specialty = resolve_specialty(specialty_id=specialty_id)
    doctor = (
        resolve_doctor(doctor_id=doctor_id, specialty=specialty)
        if doctor_id is not None
        else None
    )
    validate_appointment_date(appointment_date=appointment_date)
    validate_session(session=session)

    cleaned_reason = (reason or "").strip()
    if not cleaned_reason:
        raise ValidationError({"reason": "Lý do khám là bắt buộc."})

    patient, _ = get_or_create_patient_by_phone(
        full_name=full_name,
        phone=phone,
        email=email,
    )

    return Appointment.objects.create(
        patient=patient,
        specialty=specialty,
        doctor=doctor,
        appointment_date=appointment_date,
        session=session,
        reason=cleaned_reason,
        status=(
            Appointment.Status.CONFIRMED
            if doctor is not None
            else Appointment.Status.PENDING_ASSIGNMENT
        ),
    )


def _base_queryset():
    return Appointment.objects.select_related("patient", "specialty", "doctor")


def get_appointment(*, appointment_id: int) -> Appointment:
    appointment = _base_queryset().filter(pk=appointment_id).first()
    if appointment is None:
        raise NotFound("Không tìm thấy lịch hẹn.")
    return appointment


def lookup_appointments(*, booking_code: str = "", phone: str = ""):
    """Public lookup by booking code or phone number, never both at once."""
    cleaned_code = (booking_code or "").strip()
    cleaned_phone = (phone or "").strip()

    if not cleaned_code and not cleaned_phone:
        raise ValidationError(
            {"detail": "Cần cung cấp mã lịch hẹn hoặc số điện thoại."}
        )

    queryset = _base_queryset()
    if cleaned_code:
        try:
            code = uuid.UUID(cleaned_code)
        except (ValueError, AttributeError, TypeError) as exc:
            raise NotFound("Không tìm thấy lịch hẹn phù hợp.") from exc
        queryset = queryset.filter(booking_code=code)
    else:
        queryset = queryset.filter(patient__phone=normalize_phone(cleaned_phone))

    results = list(queryset.order_by("-appointment_date", "-id"))
    if not results:
        raise NotFound("Không tìm thấy lịch hẹn phù hợp.")
    return results


def search_appointments(
    *,
    appointment_date: datetime.date | None = None,
    doctor_id: int | None = None,
    patient_id: int | None = None,
    status: str | None = None,
    query: str = "",
):
    queryset = _base_queryset()

    if appointment_date is not None:
        queryset = queryset.filter(appointment_date=appointment_date)
    if doctor_id is not None:
        queryset = queryset.filter(doctor_id=doctor_id)
    if patient_id is not None:
        queryset = queryset.filter(patient_id=patient_id)
    if status:
        if status not in Appointment.Status.values:
            raise ValidationError({"status": "Trạng thái lọc không hợp lệ."})
        queryset = queryset.filter(status=status)

    cleaned = (query or "").strip()
    if cleaned:
        filters = Q(patient__full_name__icontains=cleaned) | Q(
            patient__phone__icontains=cleaned
        )
        try:
            filters |= Q(booking_code=uuid.UUID(cleaned))
        except (ValueError, AttributeError, TypeError):
            pass
        queryset = queryset.filter(filters)

    return queryset


@transaction.atomic
def update_appointment(
    *,
    appointment_id: int,
    doctor_id: int | None = None,
    appointment_date: datetime.date | None = None,
    session: str | None = None,
    reason: str | None = None,
    clear_doctor: bool = False,
) -> Appointment:
    """Update an unfinished appointment. No doctor/date/session clash check, per spec."""
    appointment = get_appointment(appointment_id=appointment_id)

    if appointment.status in {
        Appointment.Status.COMPLETED,
        Appointment.Status.CANCELLED,
    }:
        raise ValidationError(
            {"status": "Lịch hẹn đã kết thúc, không thể cập nhật."}
        )

    if clear_doctor:
        if appointment.status != Appointment.Status.PENDING_ASSIGNMENT:
            raise ValidationError(
                {"doctor_id": "Chỉ lịch chờ phân công mới được bỏ trống bác sĩ."}
            )
        appointment.doctor = None
    elif doctor_id is not None:
        appointment.doctor = resolve_doctor(
            doctor_id=doctor_id,
            specialty=appointment.specialty,
        )

    if appointment_date is not None:
        appointment.appointment_date = validate_appointment_date(
            appointment_date=appointment_date
        )

    if session is not None:
        appointment.session = validate_session(session=session)

    if reason is not None:
        cleaned_reason = reason.strip()
        if not cleaned_reason:
            raise ValidationError({"reason": "Lý do khám không được để trống."})
        appointment.reason = cleaned_reason

    appointment.save()
    return appointment


@transaction.atomic
def transition_appointment(
    *,
    appointment_id: int,
    target_status: str,
    user=None,
    cancellation_reason: str = "",
) -> Appointment:
    appointment = get_appointment(appointment_id=appointment_id)
    assert_can_transition(appointment.status, target_status)

    now = timezone.now()

    if target_status == Appointment.Status.CONFIRMED:
        if appointment.doctor_id is None:
            raise ValidationError(
                {
                    "doctor_id": (
                        "Phải phân công bác sĩ thuộc đúng chuyên khoa "
                        "trước khi xác nhận lịch."
                    )
                }
            )
        if not doctor_matches_specialty(
            doctor=appointment.doctor,
            specialty_id=appointment.specialty_id,
        ):
            raise ValidationError(
                {"doctor_id": "Bác sĩ không thuộc chuyên khoa đã chọn."}
            )
        if not appointment.doctor.is_active:
            raise ValidationError({"doctor_id": "Bác sĩ đã ngừng hoạt động."})

    elif target_status == Appointment.Status.IN_PROGRESS:
        appointment.started_at = now

    elif target_status == Appointment.Status.COMPLETED:
        appointment.completed_at = now

    elif target_status == Appointment.Status.CANCELLED:
        if cancellation_reason not in Appointment.CancellationReason.values:
            raise ValidationError(
                {"cancellation_reason": "Lý do hủy không hợp lệ."}
            )
        appointment.cancellation_reason = cancellation_reason
        appointment.cancelled_at = now
        appointment.cancelled_by = user if getattr(user, "pk", None) else None

    appointment.status = target_status
    appointment.save()
    return appointment
