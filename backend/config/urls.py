from django.conf import settings
from django.conf.urls.static import static
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
    path("api/v1/appointments/", include("apps.appointments.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
    path("api/v1/chatbot/", include("apps.chatbot.urls")),
    path("api/v1/specialties/", include("apps.specialties.public_urls")),
    path("api/v1/doctors/", include("apps.doctors.public_urls")),
    path(
        "api/v1/admin/specialties/",
        include("apps.specialties.admin_urls"),
    ),
    path("api/v1/admin/doctors/", include("apps.doctors.admin_urls")),
]

if settings.DEBUG:
    # Chỉ phục vụ file upload trực tiếp bằng Django trong môi trường local.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
