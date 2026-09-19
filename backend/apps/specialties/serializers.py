from rest_framework import serializers

from apps.specialties.models import Specialty


class PublicSpecialtySerializer(serializers.ModelSerializer):
    """Chỉ trả dữ liệu chuyên khoa cần thiết cho trang công khai."""

    class Meta:
        model = Specialty
        fields = ["id", "name", "description"]


class AdminSpecialtySerializer(serializers.ModelSerializer):
    """Trả đầy đủ dữ liệu chuyên khoa cho Admin."""

    class Meta:
        model = Specialty
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]


class SpecialtyCreateSerializer(serializers.Serializer):
    """Kiểm tra payload tạo chuyên khoa."""

    name = serializers.CharField(max_length=150)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    is_active = serializers.BooleanField(required=False, default=True)


class SpecialtyUpdateSerializer(serializers.Serializer):
    """Kiểm tra các trường được phép cập nhật của chuyên khoa."""

    name = serializers.CharField(max_length=150, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
