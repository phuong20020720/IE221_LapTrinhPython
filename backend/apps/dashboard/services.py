from datetime import date, timedelta

from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.patients.models import Patient


def _month_start(reference: date, months_back: int) -> date:
    month_index = reference.year * 12 + reference.month - 1 - months_back
    return date(month_index // 12, month_index % 12 + 1, 1)


def get_dashboard_summary(*, week_date: date | None = None, month: date | None = None) -> dict:
    """Tổng hợp dữ liệu vận hành cho dashboard nội bộ theo giờ Việt Nam."""
    today = timezone.localdate()
    active_appointments = Appointment.objects.exclude(
        status=Appointment.Status.CANCELLED,
    )

    week_reference = week_date or today
    week_start = week_reference - timedelta(days=week_reference.weekday())
    week_days = [week_start + timedelta(days=offset) for offset in range(6)]
    weekly_counts = {
        row["appointment_date"]: row["count"]
        for row in active_appointments.filter(
            appointment_date__range=(week_days[0], week_days[-1]),
        )
        .values("appointment_date")
        .annotate(count=Count("id"))
    }

    month_reference = month or today
    month_starts = [_month_start(month_reference, offset) for offset in reversed(range(6))]
    next_month = _month_start(month_reference, -1)
    monthly_counts = {
        (row["month"].year, row["month"].month): row["count"]
        for row in Patient.objects.filter(
            created_at__date__gte=month_starts[0],
            created_at__date__lt=next_month,
        )
        .annotate(month=TruncMonth("created_at", tzinfo=timezone.get_current_timezone()))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    }

    return {
        "generated_at": timezone.now(),
        "summary": {
            "appointments_today": active_appointments.filter(appointment_date=today).count(),
            "appointments_total": active_appointments.count(),
            "patients_total": Patient.objects.count(),
            "doctors_total": Doctor.objects.filter(is_active=True).count(),
        },
        "appointments_by_weekday": [
            {
                "date": day,
                "label": f"T{day.weekday() + 2}",
                "count": weekly_counts.get(day, 0),
            }
            for day in week_days
        ],
        "patients_by_month": [
            {
                "month": month_start.strftime("%Y-%m"),
                "label": f"T{month_start.month}/{month_start.year}",
                "count": monthly_counts.get((month_start.year, month_start.month), 0),
            }
            for month_start in month_starts
        ],
    }
