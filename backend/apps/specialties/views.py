from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.specialties.models import Specialty
from apps.specialties.serializers import SpecialtyOutputSerializer


class SpecialtyListView(APIView):
    """Active specialties, serving the public booking form."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        specialties = Specialty.objects.filter(is_active=True)
        return Response(SpecialtyOutputSerializer(specialties, many=True).data)
