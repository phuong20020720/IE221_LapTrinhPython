from django.contrib import admin

from apps.patients.models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "phone", "email", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("full_name", "phone", "email")
