from django.contrib import admin

from apps.doctors.models import Doctor, DoctorExpertise


class DoctorExpertiseInline(admin.TabularInline):
    """Cho phép sửa lĩnh vực chuyên sâu ngay trong hồ sơ bác sĩ."""

    model = DoctorExpertise
    extra = 0


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    """Cấu hình quản lý bác sĩ trong Django Admin."""

    list_display = (
        "full_name",
        "specialty",
        "phone",
        "years_of_experience",
        "is_active",
        "updated_at",
    )
    list_filter = ("is_active", "specialty")
    search_fields = ("full_name", "phone", "email", "credentials", "position")
    inlines = [DoctorExpertiseInline]


@admin.register(DoctorExpertise)
class DoctorExpertiseAdmin(admin.ModelAdmin):
    """Cấu hình tra cứu lĩnh vực chuyên sâu độc lập."""

    list_display = ("expertise_name", "doctor", "display_order", "updated_at")
    search_fields = ("expertise_name", "doctor__full_name")
