from django.contrib import admin
from django.urls import include, path

from apps.accounts.urls import auth_urlpatterns, employee_urlpatterns
from config.views import health_check


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/auth/", include((auth_urlpatterns, "accounts"), namespace="auth")),
    path(
        "api/v1/employees/",
        include((employee_urlpatterns, "accounts"), namespace="employees"),
    ),
    path("api/v1/patients/", include("apps.patients.urls")),
    path("api/v1/chatbot/", include("apps.chatbot.urls")),
]
