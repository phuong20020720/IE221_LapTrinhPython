from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole
from apps.doctors.serializers import (
    DoctorAdminSerializer,
    DoctorCreateSerializer,
    DoctorPublicSerializer,
    DoctorUpdateSerializer,
)
from apps.doctors.services import (
    create_doctor,
    deactivate_doctor,
    get_admin_doctor,
    get_public_doctor,
    list_admin_doctors,
    list_public_doctors,
    remove_doctor_profile_image,
    update_doctor,
)
from config.pagination import StandardResultsSetPagination


def _optional_active(value: str | None) -> bool | None:
    if value in {None, ""}:
        return None
    if value == "true":
        return True
    if value == "false":
        return False
    raise ValidationError({"is_active": "is_active phải là true hoặc false."})


def _parse_specialty_id(value: str | None) -> int | None:
    """Đổi query specialty_id sang số nguyên dương hoặc báo lỗi 400."""
    if value in {None, ""}:
        return None
    try:
        specialty_id = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({"specialty_id": "specialty_id phải là số nguyên."}) from exc
    if specialty_id < 1:
        raise ValidationError({"specialty_id": "specialty_id phải lớn hơn 0."})
    return specialty_id


class PublicDoctorListView(APIView):
    """Trả danh sách bác sĩ hoạt động cho trang công khai."""

    permission_classes = [AllowAny]

    def get(self, request):
        doctors = list_public_doctors(
            query=request.query_params.get("q", ""),
            specialty_id=_parse_specialty_id(
                request.query_params.get("specialty_id")
            ),
        )
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(doctors, request, view=self)
        serializer = DoctorPublicSerializer(
            page,
            many=True,
            context={"request": request},
        )
        return paginator.get_paginated_response(serializer.data)


class PublicDoctorDetailView(APIView):
    """Trả chi tiết bác sĩ hoạt động cho trang công khai."""

    permission_classes = [AllowAny]

    def get(self, request, doctor_id: int):
        doctor = get_public_doctor(doctor_id=doctor_id)
        serializer = DoctorPublicSerializer(doctor, context={"request": request})
        return Response(serializer.data)


class AdminDoctorListCreateView(APIView):
    """Cho phép Admin xem và tạo hồ sơ bác sĩ."""

    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        include_inactive = request.query_params.get("include_inactive", "true") == "true"
        doctors = list_admin_doctors(
            query=request.query_params.get("q", ""),
            specialty_id=_parse_specialty_id(
                request.query_params.get("specialty_id")
            ),
            include_inactive=include_inactive,
            is_active=_optional_active(request.query_params.get("is_active")),
        )
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(doctors, request, view=self)
        serializer = DoctorAdminSerializer(
            page,
            many=True,
            context={"request": request},
        )
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = DoctorCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doctor = create_doctor(**serializer.validated_data)
        output = DoctorAdminSerializer(doctor, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class AdminDoctorDetailView(APIView):
    """Cho phép Admin xem, sửa hoặc ngừng hoạt động bác sĩ."""

    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, doctor_id: int):
        doctor = get_admin_doctor(doctor_id=doctor_id)
        serializer = DoctorAdminSerializer(doctor, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, doctor_id: int):
        serializer = DoctorUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["years_of_experience_provided"] = "years_of_experience" in request.data
        data["profile_image_provided"] = "profile_image" in request.data
        doctor = update_doctor(doctor_id=doctor_id, **data)
        output = DoctorAdminSerializer(doctor, context={"request": request})
        return Response(output.data)

    def delete(self, request, doctor_id: int):
        deactivate_doctor(doctor_id=doctor_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDoctorProfileImageView(APIView):
    """Cho phép Admin gỡ ảnh đại diện mà không xóa bác sĩ."""

    permission_classes = [IsAdminRole]

    def delete(self, request, doctor_id: int):
        remove_doctor_profile_image(doctor_id=doctor_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
