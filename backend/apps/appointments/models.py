import uuid

from django.conf import settings
from django.db import models


class Appointment(models.Model):
    class Session(models.TextChoices):
        MORNING = "MORNING", "Buổi sáng"
        AFTERNOON = "AFTERNOON", "Buổi chiều"

    class Status(models.TextChoices):
        PENDING_ASSIGNMENT = "PENDING_ASSIGNMENT", "Chờ phân công bác sĩ"
        CONFIRMED = "CONFIRMED", "Đã xác nhận"
        IN_PROGRESS = "IN_PROGRESS", "Đang khám"
        COMPLETED = "COMPLETED", "Đã hoàn tất"
        CANCELLED = "CANCELLED", "Đã hủy"

    class CancellationReason(models.TextChoices):
        PATIENT_REQUEST = "PATIENT_REQUEST", "Bệnh nhân yêu cầu hủy"
        CLINIC = "CLINIC", "Phòng khám hủy"
        NO_SHOW = "NO_SHOW", "Bệnh nhân không đến khám"

    booking_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    specialty = models.ForeignKey(
        "specialties.Specialty",
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    doctor = models.ForeignKey(
        "doctors.Doctor",
        on_delete=models.PROTECT,
        related_name="appointments",
        null=True,
        blank=True,
    )
    appointment_date = models.DateField()
    session = models.CharField(max_length=20, choices=Session.choices)
    reason = models.TextField()
    status = models.CharField(max_length=30, choices=Status.choices)
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
        null=True,
        blank=True,
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-appointment_date", "session", "-id"]
        indexes = [
            models.Index(fields=["appointment_date"], name="ix_appt_date"),
            models.Index(fields=["doctor", "appointment_date"], name="ix_appt_doctor_date"),
            models.Index(fields=["patient", "appointment_date"], name="ix_appt_patient_date"),
            models.Index(fields=["status", "appointment_date"], name="ix_appt_status_date"),
            models.Index(
                fields=["specialty", "appointment_date"],
                name="ix_appt_specialty_date",
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
                        "PENDING_ASSIGNMENT",
                        "CONFIRMED",
                        "IN_PROGRESS",
                        "COMPLETED",
                        "CANCELLED",
                    ]
                ),
                name="appointments_status_valid",
            ),
            models.CheckConstraint(
                condition=~models.Q(status="CANCELLED")
                | ~models.Q(cancellation_reason=""),
                name="appointments_cancelled_requires_reason",
            ),
            # Only unassigned or cancelled appointments may lack a doctor.
            models.CheckConstraint(
                condition=models.Q(status__in=["PENDING_ASSIGNMENT", "CANCELLED"])
                | models.Q(doctor__isnull=False),
                name="appointments_doctor_required_when_active",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.booking_code} - {self.appointment_date} {self.session}"
