from datetime import date

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployeeOrAdmin
from apps.appointments.serializers import (
    AppointmentAdminSerializer,
    AppointmentCancelSerializer,
    AppointmentCreateSerializer,
    AppointmentPublicSerializer,
    AppointmentUpdateSerializer,
)
from apps.appointments.services import (
    cancel_appointment,
    create_public_appointment,
    get_appointment,
    list_appointments,
    update_appointment,
)
from config.pagination import StandardResultsSetPagination


def _optional_int(value: str | None, field: str) -> int | None:
    """Đổi query param id sang số nguyên dương."""
    if value in {None, ""}:
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({field: f"{field} phải là số nguyên."}) from exc
    if parsed < 1:
        raise ValidationError({field: f"{field} phải lớn hơn 0."})
    return parsed


def _optional_date(value: str | None) -> date | None:
    """Đổi query ngày ISO sang date hoặc báo lỗi 400."""
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError({"appointment_date": "Ngày phải có dạng YYYY-MM-DD."}) from exc


def _appointment_scope(value: str | None) -> str:
    scope = value or "all"
    if scope not in {"today", "upcoming", "unassigned", "history", "all"}:
        raise ValidationError({"scope": "Phạm vi lịch hẹn không hợp lệ."})
    return scope


class AppointmentListCreateView(APIView):
    """POST công khai để đặt lịch; GET nội bộ để quản lý danh sách."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "POST" else [IsEmployeeOrAdmin()]

    def get(self, request):
        appointments = list_appointments(
            query=request.query_params.get("q", ""),
            status=request.query_params.get("status", ""),
            session=request.query_params.get("session", ""),
            specialty_id=_optional_int(request.query_params.get("specialty_id"), "specialty_id"),
            doctor_id=_optional_int(request.query_params.get("doctor_id"), "doctor_id"),
            patient_id=_optional_int(request.query_params.get("patient_id"), "patient_id"),
            appointment_date=_optional_date(request.query_params.get("appointment_date")),
            scope=_appointment_scope(request.query_params.get("scope")),
        )
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(appointments, request, view=self)
        serializer = AppointmentAdminSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = AppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = create_public_appointment(**serializer.validated_data)
        return Response(
            AppointmentPublicSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


class AppointmentDetailView(APIView):
    """Cho Employee/Admin xem, cập nhật và hủy lịch."""

    permission_classes = [IsEmployeeOrAdmin]

    def get(self, request, appointment_id: int):
        appointment = get_appointment(appointment_id=appointment_id)
        return Response(AppointmentAdminSerializer(appointment).data)

    def patch(self, request, appointment_id: int):
        serializer = AppointmentUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["doctor_id_provided"] = "doctor_id" in request.data
        appointment = update_appointment(
            appointment_id=appointment_id,
            actor=request.user,
            **data,
        )
        return Response(AppointmentAdminSerializer(appointment).data)

    def delete(self, request, appointment_id: int):
        serializer = AppointmentCancelSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        appointment = cancel_appointment(
            appointment_id=appointment_id,
            actor=request.user,
            **serializer.validated_data,
        )
        return Response(AppointmentAdminSerializer(appointment).data)
