from django.contrib import admin

from apps.specialties.models import Specialty


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    """Cấu hình quản lý chuyên khoa trong Django Admin."""

    list_display = ("name", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
