from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.doctors.models import Doctor
from apps.doctors.serializers import DoctorOutputSerializer


class DoctorListView(APIView):
    """Active doctors, filterable by specialty for the booking form."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        doctors = Doctor.objects.select_related("specialty").filter(is_active=True)
        specialty_id = request.query_params.get("specialty_id")
        if specialty_id:
            doctors = doctors.filter(specialty_id=specialty_id)
        return Response(DoctorOutputSerializer(doctors, many=True).data)
