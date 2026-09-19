from pathlib import Path
from uuid import uuid4

from django.db import models
from django.utils import timezone

from apps.specialties.models import Specialty


def doctor_image_upload_path(instance, filename: str) -> str:
    """Sinh đường dẫn ảnh không dùng tên file do người dùng cung cấp."""
    suffix = Path(filename).suffix.lower()
    now = timezone.now()
    return f"doctors/{now:%Y/%m}/{uuid4().hex}{suffix}"


class Doctor(models.Model):
    """Lưu hồ sơ nghề nghiệp và trạng thái hoạt động của bác sĩ."""

    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        related_name="doctors",
    )
    full_name = models.CharField(max_length=150)
    credentials = models.CharField(max_length=100, blank=True, default="")
    position = models.CharField(max_length=150, blank=True, default="")
    years_of_experience = models.PositiveIntegerField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, default="")
    profile_image = models.ImageField(
        upload_to=doctor_image_upload_path,
        blank=True,
        null=True,
    )
    professional_description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name", "id"]
        indexes = [
            models.Index(
                fields=["specialty", "is_active"],
                name="ix_doctors_specialty_active",
            ),
            models.Index(fields=["full_name"], name="ix_doctors_full_name"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(years_of_experience__gte=0)
                | models.Q(years_of_experience__isnull=True),
                name="doctors_experience_nonnegative",
            ),
        ]

    def __str__(self) -> str:
        return self.display_name

    @property
    def display_name(self) -> str:
        """Ghép học vị và họ tên, đồng thời tránh lặp tiền tố đã có trong tên."""
        name = self.full_name.strip()
        credentials = self.credentials.strip()
        normalized_name = name.casefold()
        has_title_prefix = normalized_name.startswith(
            ("bs ", "bs. ", "bác sĩ ", "ts.bs ", "ths.bs ")
        )
        if not credentials or has_title_prefix or normalized_name.startswith(
            f"{credentials.casefold()} "
        ):
            return name
        return f"{credentials} {name}"


class DoctorExpertise(models.Model):
    """Lưu một lĩnh vực chuyên sâu thuộc hồ sơ bác sĩ."""

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="expertises",
    )
    expertise_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]
        indexes = [
            models.Index(
                fields=["doctor", "display_order"],
                name="ix_expertise_doctor_order",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.doctor.full_name}: {self.expertise_name}"
