from django.contrib import admin

from apps.appointments.models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Hỗ trợ kiểm tra lịch hẹn trong Django Admin khi phát triển."""

    list_display = (
        "booking_code", "patient", "specialty", "doctor",
        "appointment_date", "session", "status",
    )
    list_filter = ("status", "session", "appointment_date", "specialty")
    search_fields = ("booking_code", "patient__full_name", "patient__phone")
