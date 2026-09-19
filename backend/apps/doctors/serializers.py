from rest_framework import serializers

from apps.doctors.models import Doctor


class DoctorOutputSerializer(serializers.ModelSerializer):
    specialty_name = serializers.CharField(source="specialty.name", read_only=True)

    class Meta:
        model = Doctor
        fields = [
            "id",
            "full_name",
            "credentials",
            "position",
            "specialty",
            "specialty_name",
            "is_active",
        ]
