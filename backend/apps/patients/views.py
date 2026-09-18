from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployeeOrAdmin
from apps.patients.serializers import (
    PatientCreateSerializer,
    PatientOutputSerializer,
    PatientUpdateSerializer,
)
from apps.patients.services import (
    create_patient,
    deactivate_patient,
    get_patient,
    search_patients,
    update_patient,
)


class PatientListCreateView(APIView):
    permission_classes = [IsEmployeeOrAdmin]

    def get(self, request):
        query = request.query_params.get("q", "")
        include_inactive = request.query_params.get("include_inactive") == "true"
        patients = search_patients(query=query, include_inactive=include_inactive)
        return Response(PatientOutputSerializer(patients, many=True).data)

    def post(self, request):
        serializer = PatientCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = create_patient(**serializer.validated_data)
        return Response(
            PatientOutputSerializer(patient).data,
            status=status.HTTP_201_CREATED,
        )


class PatientDetailView(APIView):
    permission_classes = [IsEmployeeOrAdmin]

    def get(self, request, patient_id: int):
        patient = get_patient(patient_id=patient_id)
        return Response(PatientOutputSerializer(patient).data)

    def patch(self, request, patient_id: int):
        serializer = PatientUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        patient = update_patient(patient_id=patient_id, **serializer.validated_data)
        return Response(PatientOutputSerializer(patient).data)

    def delete(self, request, patient_id: int):
        patient = deactivate_patient(patient_id=patient_id)
        return Response(PatientOutputSerializer(patient).data)
