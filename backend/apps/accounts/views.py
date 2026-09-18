from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.accounts.permissions import IsAdminRole
from apps.accounts.serializers import (
    CurrentUserSerializer,
    EmployeeCreateSerializer,
    EmployeeOutputSerializer,
    EmployeeUpdateSerializer,
    MediBookTokenObtainPairSerializer,
)
from apps.accounts.services import (
    create_employee,
    deactivate_employee,
    get_employee,
    list_employees,
    update_employee,
)


class MediBookTokenObtainPairView(TokenObtainPairView):
    serializer_class = MediBookTokenObtainPairSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


class EmployeeListCreateView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        include_inactive = request.query_params.get("include_inactive") == "true"
        employees = list_employees(include_inactive=include_inactive)
        return Response(EmployeeOutputSerializer(employees, many=True).data)

    def post(self, request):
        serializer = EmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = create_employee(**serializer.validated_data)
        return Response(
            EmployeeOutputSerializer(employee).data,
            status=status.HTTP_201_CREATED,
        )


class EmployeeDetailView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, employee_id: int):
        employee = get_employee(employee_id=employee_id)
        return Response(EmployeeOutputSerializer(employee).data)

    def patch(self, request, employee_id: int):
        serializer = EmployeeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        employee = update_employee(employee_id=employee_id, **serializer.validated_data)
        return Response(EmployeeOutputSerializer(employee).data)

    def delete(self, request, employee_id: int):
        employee = deactivate_employee(employee_id=employee_id, actor=request.user)
        return Response(EmployeeOutputSerializer(employee).data)
