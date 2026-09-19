from datetime import date

from django.db import transaction
from django.db.models import Case, IntegerField, Q, Value, When
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from apps.appointments.emails import send_appointment_confirmation
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.patients.services import get_or_create_patient_by_phone
from apps.specialties.models import Specialty


TERMINAL_STATUSES = {
    Appointment.Status.COMPLETED,
    Appointment.Status.CANCELLED,
}
ALLOWED_TRANSITIONS = {
    Appointment.Status.CONFIRMED: {
        Appointment.Status.IN_PROGRESS,
        Appointment.Status.CANCELLED,
    },
    Appointment.Status.IN_PROGRESS: {
        Appointment.Status.COMPLETED,
        Appointment.Status.CANCELLED,
    },
}


def _get_active_specialty(specialty_id: int) -> Specialty:
    """Lấy chuyên khoa đang hoạt động hoặc trả lỗi dữ liệu đầu vào."""
    try:
        return Specialty.objects.get(pk=specialty_id, is_active=True)
    except Specialty.DoesNotExist as exc:
        raise ValidationError(
            {"specialty_id": "Chuyên khoa không tồn tại hoặc đã ngừng hoạt động."}
        ) from exc


def _get_valid_doctor(doctor_id: int | None, specialty: Specialty) -> Doctor | None:
    """Kiểm tra bác sĩ hoạt động và thuộc đúng chuyên khoa đã chọn."""
    if doctor_id is None:
        return None
    try:
        doctor = Doctor.objects.get(pk=doctor_id, is_active=True)
    except Doctor.DoesNotExist as exc:
        raise ValidationError(
            {"doctor_id": "Bác sĩ không tồn tại hoặc đã ngừng hoạt động."}
        ) from exc
    if doctor.specialty_id != specialty.id:
        raise ValidationError(
            {"doctor_id": "Bác sĩ không thuộc chuyên khoa đã chọn."}
        )
    return doctor


def _validate_appointment_date(value: date) -> None:
    """Không cho tạo hoặc dời lịch về ngày đã qua."""
    if value < timezone.localdate():
        raise ValidationError(
            {"appointment_date": "Ngày khám không được ở trong quá khứ."}
        )


def get_appointment(*, appointment_id: int, for_update: bool = False) -> Appointment:
    """Lấy lịch hẹn kèm dữ liệu liên quan cho API nội bộ."""
    queryset = Appointment.objects.select_related(
        "patient", "specialty", "doctor", "cancelled_by"
    )
    if for_update:
        # Chỉ khóa Appointment; PostgreSQL không cho khóa nullable outer join.
        queryset = queryset.select_for_update(of=("self",))
    try:
        return queryset.get(pk=appointment_id)
    except Appointment.DoesNotExist as exc:
        raise NotFound("Không tìm thấy lịch hẹn.") from exc


def list_appointments(
    *,
    query: str = "",
    status: str = "",
    session: str = "",
    specialty_id: int | None = None,
    doctor_id: int | None = None,
    patient_id: int | None = None,
    appointment_date: date | None = None,
    scope: str = "all",
):
    """Lọc danh sách lịch cho màn hình quản trị."""
    queryset = Appointment.objects.select_related(
        "patient", "specialty", "doctor", "cancelled_by"
    )
    cleaned_query = query.strip()
    if cleaned_query:
        queryset = queryset.filter(
            Q(patient__full_name__icontains=cleaned_query)
            | Q(patient__phone__icontains=cleaned_query)
            | Q(booking_code__icontains=cleaned_query)
        )
    if status:
        queryset = queryset.filter(status=status)
    if session:
        queryset = queryset.filter(session=session)
    if specialty_id is not None:
        queryset = queryset.filter(specialty_id=specialty_id)
    if doctor_id is not None:
        queryset = queryset.filter(doctor_id=doctor_id)
    if patient_id is not None:
        queryset = queryset.filter(patient_id=patient_id)
    if appointment_date is not None:
        queryset = queryset.filter(appointment_date=appointment_date)

    today = timezone.localdate()
    active_statuses = [Appointment.Status.CONFIRMED, Appointment.Status.IN_PROGRESS]
    if scope == "today":
        queryset = queryset.filter(appointment_date=today)
    elif scope == "upcoming":
        queryset = queryset.filter(
            appointment_date__gt=today,
            status__in=active_statuses,
        )
    elif scope == "unassigned":
        queryset = queryset.filter(
            appointment_date__gte=today,
            doctor__isnull=True,
            status__in=active_statuses,
        )
    elif scope == "history":
        queryset = queryset.filter(
            Q(appointment_date__lt=today) | Q(status__in=TERMINAL_STATUSES)
        )

    status_priority = Case(
        When(status=Appointment.Status.IN_PROGRESS, then=Value(0)),
        When(status=Appointment.Status.CONFIRMED, then=Value(1)),
        When(status=Appointment.Status.COMPLETED, then=Value(2)),
        default=Value(3),
        output_field=IntegerField(),
    )
    session_priority = Case(
        When(session=Appointment.Session.MORNING, then=Value(0)),
        default=Value(1),
        output_field=IntegerField(),
    )
    queryset = queryset.annotate(
        _status_priority=status_priority,
        _session_priority=session_priority,
    )
    if scope in {"today", "upcoming", "unassigned"}:
        return queryset.order_by(
            "appointment_date",
            "_status_priority",
            "_session_priority",
            "created_at",
        )
    return queryset.order_by("-appointment_date", "_status_priority", "-created_at")


@transaction.atomic
def create_public_appointment(
    *,
    full_name: str,
    phone: str,
    email: str,
    specialty_id: int,
    appointment_date: date,
    session: str,
    reason: str,
    doctor_id: int | None = None,
) -> Appointment:
    """Tạo/tái sử dụng Patient và lịch CONFIRMED trong cùng transaction."""
    _validate_appointment_date(appointment_date)
    specialty = _get_active_specialty(specialty_id)
    doctor = _get_valid_doctor(doctor_id, specialty)
    patient, _ = get_or_create_patient_by_phone(
        full_name=full_name,
        phone=phone,
        email=email,
    )
    appointment = Appointment.objects.create(
        patient=patient,
        specialty=specialty,
        doctor=doctor,
        appointment_date=appointment_date,
        session=session,
        reason=reason.strip(),
        status=Appointment.Status.CONFIRMED,
    )
    transaction.on_commit(
        lambda: send_appointment_confirmation(appointment.id, recipient=email)
    )
    return get_appointment(appointment_id=appointment.id)


@transaction.atomic
def update_appointment(
    *,
    appointment_id: int,
    actor,
    specialty_id: int | None = None,
    doctor_id: int | None = None,
    doctor_id_provided: bool = False,
    appointment_date: date | None = None,
    session: str | None = None,
    reason: str | None = None,
    status: str | None = None,
    cancellation_reason: str | None = None,
) -> Appointment:
    """Cập nhật lịch và cưỡng chế state machine tại service layer."""
    appointment = get_appointment(appointment_id=appointment_id, for_update=True)
    if appointment.status in TERMINAL_STATUSES:
        raise ValidationError("Lịch đã kết thúc nên không thể cập nhật.")

    specialty = appointment.specialty
    if specialty_id is not None:
        specialty = _get_active_specialty(specialty_id)
        appointment.specialty = specialty

    if doctor_id_provided:
        appointment.doctor = _get_valid_doctor(doctor_id, specialty)
    elif appointment.doctor and appointment.doctor.specialty_id != specialty.id:
        raise ValidationError(
            {"doctor_id": "Hãy chọn lại bác sĩ thuộc chuyên khoa mới."}
        )

    if appointment_date is not None:
        _validate_appointment_date(appointment_date)
        appointment.appointment_date = appointment_date
    if session is not None:
        appointment.session = session
    if reason is not None:
        appointment.reason = reason.strip()

    if status is not None and status != appointment.status:
        allowed = ALLOWED_TRANSITIONS.get(appointment.status, set())
        if status not in allowed:
            raise ValidationError(
                {"status": "Không thể chuyển sang trạng thái được yêu cầu."}
            )
        now = timezone.now()
        if status == Appointment.Status.IN_PROGRESS:
            appointment.started_at = now
        elif status == Appointment.Status.COMPLETED:
            appointment.completed_at = now
        elif status == Appointment.Status.CANCELLED:
            if not cancellation_reason:
                raise ValidationError(
                    {"cancellation_reason": "Cần chọn lý do hủy lịch."}
                )
            appointment.cancellation_reason = cancellation_reason
            appointment.cancelled_by = actor
            appointment.cancelled_at = now
        appointment.status = status
    elif cancellation_reason is not None:
        raise ValidationError(
            {"cancellation_reason": "Lý do hủy chỉ dùng khi chuyển sang CANCELLED."}
        )

    appointment.save()
    return get_appointment(appointment_id=appointment.id)


def cancel_appointment(*, appointment_id: int, actor, cancellation_reason: str):
    """Xử lý DELETE như một lần chuyển trạng thái sang CANCELLED."""
    return update_appointment(
        appointment_id=appointment_id,
        actor=actor,
        status=Appointment.Status.CANCELLED,
        cancellation_reason=cancellation_reason,
    )

