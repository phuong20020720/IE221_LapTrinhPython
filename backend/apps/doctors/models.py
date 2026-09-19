from django.db import models


class Doctor(models.Model):
    specialty = models.ForeignKey(
        "specialties.Specialty",
        on_delete=models.PROTECT,
        related_name="doctors",
    )
    full_name = models.CharField(max_length=150)
    credentials = models.CharField(max_length=100, blank=True, default="")
    position = models.CharField(max_length=150, blank=True, default="")
    years_of_experience = models.IntegerField(null=True, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, default="")
    profile_image_url = models.CharField(max_length=500, blank=True, default="")
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
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(years_of_experience__isnull=True)
                | models.Q(years_of_experience__gte=0),
                name="doctors_years_of_experience_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return self.full_name


class DoctorExpertise(models.Model):
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="expertises",
    )
    expertise_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    display_order = models.IntegerField(default=0)
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
        return self.expertise_name
