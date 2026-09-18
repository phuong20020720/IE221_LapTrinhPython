from django.db import models


class Patient(models.Model):
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["full_name"], name="ix_patients_full_name"),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.phone})"
