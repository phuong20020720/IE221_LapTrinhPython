from rest_framework import serializers

from apps.specialties.models import Specialty


class SpecialtyOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ["id", "name", "description", "is_active"]
