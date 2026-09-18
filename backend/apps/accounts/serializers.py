from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import User


class MediBookTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "full_name": self.user.full_name,
            "role": self.user.role,
        }
        return data


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
        ]


class EmployeeOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "last_login",
            "created_at",
            "updated_at",
        ]


class EmployeeCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value


class EmployeeUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    is_active = serializers.BooleanField(required=False)

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value
