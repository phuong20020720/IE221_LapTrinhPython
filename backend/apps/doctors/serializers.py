import json
from pathlib import Path

from rest_framework import serializers

from apps.doctors.models import Doctor, DoctorExpertise


ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


class DoctorSpecialtySerializer(serializers.Serializer):
    """Biểu diễn chuyên khoa rút gọn trong response bác sĩ."""

    id = serializers.IntegerField()
    name = serializers.CharField()


class DoctorExpertiseSerializer(serializers.ModelSerializer):
    """Biểu diễn một lĩnh vực chuyên sâu của bác sĩ."""

    class Meta:
        model = DoctorExpertise
        fields = ["id", "expertise_name", "description", "display_order"]


class DoctorPublicSerializer(serializers.ModelSerializer):
    """Trả hồ sơ nghề nghiệp an toàn cho trang công khai."""

    specialty = DoctorSpecialtySerializer(read_only=True)
    expertises = DoctorExpertiseSerializer(many=True, read_only=True)
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            "id",
            "full_name",
            "credentials",
            "position",
            "years_of_experience",
            "profile_image_url",
            "professional_description",
            "specialty",
            "expertises",
        ]

    def get_profile_image_url(self, doctor: Doctor) -> str | None:
        """Trả URL tuyệt đối của ảnh nếu bác sĩ có ảnh đại diện."""
        if not doctor.profile_image:
            return None
        request = self.context.get("request")
        url = doctor.profile_image.url
        return request.build_absolute_uri(url) if request else url


class DoctorAdminSerializer(DoctorPublicSerializer):
    """Bổ sung dữ liệu liên hệ và trạng thái chỉ dành cho Admin."""

    class Meta(DoctorPublicSerializer.Meta):
        fields = DoctorPublicSerializer.Meta.fields + [
            "phone",
            "email",
            "is_active",
            "created_at",
            "updated_at",
        ]


class ExpertiseListField(serializers.Field):
    """Nhận expertises dạng list JSON hoặc chuỗi JSON từ multipart form."""

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError(
                    "Danh sách lĩnh vực chuyên sâu phải là JSON hợp lệ."
                ) from exc
        if not isinstance(data, list):
            raise serializers.ValidationError("Lĩnh vực chuyên sâu phải là một danh sách.")
        serializer = ExpertiseInputSerializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def to_representation(self, value):
        return value


class ExpertiseInputSerializer(serializers.Serializer):
    """Kiểm tra một lĩnh vực chuyên sâu trong payload ghi dữ liệu."""

    expertise_name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    display_order = serializers.IntegerField(required=False, min_value=0, default=0)


class DoctorInputSerializer(serializers.Serializer):
    """Kiểm tra dữ liệu tạo hoặc cập nhật bác sĩ."""

    specialty_id = serializers.IntegerField(min_value=1, required=False)
    full_name = serializers.CharField(max_length=150, required=False)
    credentials = serializers.CharField(max_length=100, required=False, allow_blank=True)
    position = serializers.CharField(max_length=150, required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(
        min_value=0,
        required=False,
        allow_null=True,
    )
    phone = serializers.CharField(max_length=20, required=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False)
    professional_description = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    expertises = ExpertiseListField(required=False)

    def validate_profile_image(self, value):
        """Giới hạn định dạng và dung lượng ảnh đại diện."""
        suffix = Path(value.name).suffix.lower()
        content_type = getattr(value, "content_type", "")
        if (
            suffix not in ALLOWED_IMAGE_EXTENSIONS
            or content_type not in ALLOWED_IMAGE_CONTENT_TYPES
        ):
            raise serializers.ValidationError(
                "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP."
            )
        if value.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError("Ảnh đại diện không được vượt quá 5 MB.")
        return value


class DoctorCreateSerializer(DoctorInputSerializer):
    """Yêu cầu đủ trường bắt buộc khi tạo bác sĩ."""

    specialty_id = serializers.IntegerField(min_value=1)
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20)


class DoctorUpdateSerializer(DoctorInputSerializer):
    """Cho phép cập nhật từng phần hồ sơ bác sĩ."""

