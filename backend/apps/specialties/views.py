from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole
from apps.specialties.serializers import (
    AdminSpecialtySerializer,
    PublicSpecialtySerializer,
    SpecialtyCreateSerializer,
    SpecialtyUpdateSerializer,
)
from apps.specialties.services import (
    create_specialty,
    deactivate_specialty,
    get_admin_specialty,
    get_public_specialty,
    list_admin_specialties,
    list_public_specialties,
    update_specialty,
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


class PublicSpecialtyListView(APIView):
    """Trả danh sách chuyên khoa hoạt động cho khách hàng."""

    permission_classes = [AllowAny]

    def get(self, request):
        specialties = list_public_specialties(query=request.query_params.get("q", ""))
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(specialties, request, view=self)
        return paginator.get_paginated_response(
            PublicSpecialtySerializer(page, many=True).data
        )


class PublicSpecialtyDetailView(APIView):
    """Trả chi tiết một chuyên khoa đang hoạt động."""

    permission_classes = [AllowAny]

    def get(self, request, specialty_id: int):
        specialty = get_public_specialty(specialty_id=specialty_id)
        return Response(PublicSpecialtySerializer(specialty).data)


class AdminSpecialtyListCreateView(APIView):
    """Cho phép Admin xem và tạo chuyên khoa."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        include_inactive = request.query_params.get("include_inactive", "true") == "true"
        specialties = list_admin_specialties(
            query=request.query_params.get("q", ""),
            include_inactive=include_inactive,
            is_active=_optional_active(request.query_params.get("is_active")),
        )
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(specialties, request, view=self)
        return paginator.get_paginated_response(
            AdminSpecialtySerializer(page, many=True).data
        )

    def post(self, request):
        serializer = SpecialtyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        specialty = create_specialty(**serializer.validated_data)
        return Response(
            AdminSpecialtySerializer(specialty).data,
            status=status.HTTP_201_CREATED,
        )


class AdminSpecialtyDetailView(APIView):
    """Cho phép Admin xem, sửa hoặc ngừng một chuyên khoa."""

    permission_classes = [IsAdminRole]

    def get(self, request, specialty_id: int):
        specialty = get_admin_specialty(specialty_id=specialty_id)
        return Response(AdminSpecialtySerializer(specialty).data)

    def patch(self, request, specialty_id: int):
        serializer = SpecialtyUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        specialty = update_specialty(
            specialty_id=specialty_id,
            **serializer.validated_data,
        )
        return Response(AdminSpecialtySerializer(specialty).data)

    def delete(self, request, specialty_id: int):
        deactivate_specialty(specialty_id=specialty_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
