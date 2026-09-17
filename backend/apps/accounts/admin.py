from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User


@admin.register(User)
class MediBookUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("MediBook", {"fields": ("full_name", "role")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("MediBook", {"fields": ("full_name", "role")}),
    )

