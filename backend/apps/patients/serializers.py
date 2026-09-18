from rest_framework import serializers

from apps.patients.models import Patient
from apps.patients.phone import normalize_phone


def join_full_name(*, family_name: str, given_name: str) -> str:
    full_name = f"{family_name.strip()} {given_name.strip()}".strip()
    if not full_name:
        raise serializers.ValidationError(
            {"family_name": "Họ và tên là bắt buộc."}
        )
    return full_name


class PatientOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "id",
            "full_name",
            "phone",
            "email",
            "is_active",
            "created_at",
            "updated_at",
        ]


class PatientCreateSerializer(serializers.Serializer):
    family_name = serializers.CharField(max_length=75)
    given_name = serializers.CharField(max_length=75)
    phone = serializers.CharField(max_length=30)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_phone(self, value: str) -> str:
        return normalize_phone(value)

    def validate(self, attrs):
        attrs["full_name"] = join_full_name(
            family_name=attrs.pop("family_name"),
            given_name=attrs.pop("given_name"),
        )
        return attrs


class PatientUpdateSerializer(serializers.Serializer):
    family_name = serializers.CharField(max_length=75, required=False)
    given_name = serializers.CharField(max_length=75, required=False)
    phone = serializers.CharField(max_length=30, required=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

    def validate_phone(self, value: str) -> str:
        return normalize_phone(value)

    def validate(self, attrs):
        family_name = attrs.pop("family_name", None)
        given_name = attrs.pop("given_name", None)
        if family_name is not None or given_name is not None:
            if family_name is None or given_name is None:
                raise serializers.ValidationError(
                    "Cần gửi đồng thời họ và tên khi cập nhật tên."
                )
            attrs["full_name"] = join_full_name(
                family_name=family_name,
                given_name=given_name,
            )
        return attrs
