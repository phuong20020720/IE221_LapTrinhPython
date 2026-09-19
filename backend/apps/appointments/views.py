from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployeeOrAdmin
from apps.appointments.models import Appointment
from apps.appointments.serializers import (
    AppointmentCreateSerializer,
    AppointmentLookupQuerySerializer,
    AppointmentOutputSerializer,
    AppointmentTransitionSerializer,
    AppointmentUpdateSerializer,
    PublicAppointmentSerializer,
)
from apps.appointments.services import (
    DEFAULT_PAGE_SIZE,
    create_appointment,
    get_appointment,
    lookup_appointments,
    paginate,
    search_appointments,
    transition_appointment,
    update_appointment,
)


class AppointmentListCreateView(APIView):
    """`POST` is public for patients; `GET` is internal accounts only."""

    throttle_scope = "appointment-booking"

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsEmployeeOrAdmin()]

    def get_throttles(self):
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return []

    def get(self, request):
        appointments = search_appointments(
            appointment_date=_parse_date(request.query_params.get("date")),
            doctor_id=_parse_int(request.query_params.get("doctor_id")),
            patient_id=_parse_int(request.query_params.get("patient_id")),
            status=request.query_params.get("status"),
            query=request.query_params.get("q", ""),
        )
        page = paginate(
            appointments,
            page=_parse_int(request.query_params.get("page")) or 1,
            page_size=_parse_int(request.query_params.get("page_size"))
            or DEFAULT_PAGE_SIZE,
        )
        page["results"] = AppointmentOutputSerializer(
            page["results"], many=True
        ).data
        return Response(page)

    def post(self, request):
        serializer = AppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = create_appointment(**serializer.validated_data)
        return Response(
            PublicAppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


class AppointmentLookupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        serializer = AppointmentLookupQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        appointments = lookup_appointments(**serializer.validated_data)
        return Response(PublicAppointmentSerializer(appointments, many=True).data)


class AppointmentDetailView(APIView):
    permission_classes = [IsEmployeeOrAdmin]

    def get(self, request, appointment_id: int):
        appointment = get_appointment(appointment_id=appointment_id)
        return Response(AppointmentOutputSerializer(appointment).data)

    def patch(self, request, appointment_id: int):
        serializer = AppointmentUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        appointment = update_appointment(
            appointment_id=appointment_id,
            **serializer.validated_data,
        )
        return Response(AppointmentOutputSerializer(appointment).data)

    def delete(self, request, appointment_id: int):
        """A delete in the UI cancels the appointment so history survives."""
        reason = request.data.get(
            "cancellation_reason",
            Appointment.CancellationReason.CLINIC,
        )
        appointment = transition_appointment(
            appointment_id=appointment_id,
            target_status=Appointment.Status.CANCELLED,
            user=request.user,
            cancellation_reason=reason,
        )
        return Response(AppointmentOutputSerializer(appointment).data)


class AppointmentTransitionView(APIView):
    permission_classes = [IsEmployeeOrAdmin]

    def post(self, request, appointment_id: int):
        serializer = AppointmentTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = transition_appointment(
            appointment_id=appointment_id,
            target_status=serializer.validated_data["status"],
            user=request.user,
            cancellation_reason=serializer.validated_data["cancellation_reason"],
        )
        return Response(AppointmentOutputSerializer(appointment).data)


def _parse_int(raw: str | None) -> int | None:
    try:
        return int(raw) if raw else None
    except (TypeError, ValueError):
        return None


def _parse_date(raw: str | None):
    from django.utils.dateparse import parse_date

    return parse_date(raw) if raw else None
