import uuid

from django.conf import settings
from django.db import models

from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.specialties.models import Specialty


class Appointment(models.Model):
    """Lưu yêu cầu khám và vòng đời xử lý của một lịch hẹn."""

    class Session(models.TextChoices):
        MORNING = "MORNING", "Buổi sáng"
        AFTERNOON = "AFTERNOON", "Buổi chiều"

    class Status(models.TextChoices):
        CONFIRMED = "CONFIRMED", "Đã xác nhận"
        IN_PROGRESS = "IN_PROGRESS", "Đang khám"
        COMPLETED = "COMPLETED", "Hoàn tất"
        CANCELLED = "CANCELLED", "Đã hủy"

    class CancellationReason(models.TextChoices):
        PATIENT_REQUEST = "PATIENT_REQUEST", "Khách hàng yêu cầu"
        CLINIC = "CLINIC", "Phòng khám hủy"
        NO_SHOW = "NO_SHOW", "Khách không đến"

    booking_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.PROTECT,
        related_name="appointments",
        blank=True,
        null=True,
    )
    appointment_date = models.DateField()
    session = models.CharField(max_length=20, choices=Session.choices)
    reason = models.TextField()
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.CONFIRMED,
    )
    cancellation_reason = models.CharField(
        max_length=30,
        choices=CancellationReason.choices,
        blank=True,
        default="",
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="cancelled_appointments",
        blank=True,
        null=True,
    )
    cancelled_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-appointment_date", "-created_at"]
        indexes = [
            models.Index(fields=["appointment_date"], name="ix_appointments_date"),
            models.Index(
                fields=["doctor", "appointment_date"],
                name="ix_appointments_doctor_date",
            ),
            models.Index(
                fields=["patient", "appointment_date"],
                name="ix_appointments_patient_date",
            ),
            models.Index(
                fields=["status", "appointment_date"],
                name="ix_appointments_status_date",
            ),
            models.Index(
                fields=["specialty", "appointment_date"],
                name="ix_appointments_specialty_date",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(session__in=["MORNING", "AFTERNOON"]),
                name="appointments_session_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    status__in=[
                        "CONFIRMED",
                        "IN_PROGRESS",
                        "COMPLETED",
                        "CANCELLED",
                    ]
                ),
                name="appointments_status_valid",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(status="CANCELLED")
                    & ~models.Q(cancellation_reason="")
                )
                | ~models.Q(status="CANCELLED"),
                name="appointments_cancel_reason_required",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.booking_code} - {self.patient.full_name}"
