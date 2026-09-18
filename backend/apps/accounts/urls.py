from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    CurrentUserView,
    EmployeeDetailView,
    EmployeeListCreateView,
    MediBookTokenObtainPairView,
)


auth_urlpatterns = [
    path("token/", MediBookTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="auth-me"),
]

employee_urlpatterns = [
    path("", EmployeeListCreateView.as_view(), name="employee-list-create"),
    path("<int:employee_id>/", EmployeeDetailView.as_view(), name="employee-detail"),
]
