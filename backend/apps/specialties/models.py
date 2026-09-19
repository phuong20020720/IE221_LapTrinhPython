from django.db import models
class Specialty(models.Model):
    """Lưu thông tin chuyên khoa phục vụ tra cứu và phân công bác sĩ."""

    name = models.CharField(max_length=150)
    name_key = models.CharField(max_length=300, unique=True, editable=False)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]

    def save(self, *args, **kwargs):
        """Chuẩn hóa khóa tên để unique Unicode nhất quán giữa các database."""
        self.name = self.name.strip()
        self.name_key = self.name.casefold()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name
