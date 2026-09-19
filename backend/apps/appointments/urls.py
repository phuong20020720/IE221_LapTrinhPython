from django.urls import path

from apps.appointments.views import (
    AppointmentDetailView,
    AppointmentListCreateView,
)


urlpatterns = [
    path("", AppointmentListCreateView.as_view(), name="appointment-list-create"),
    path("<int:appointment_id>/", AppointmentDetailView.as_view(), name="appointment-detail"),
]
