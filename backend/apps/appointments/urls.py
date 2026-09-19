from django.urls import path

from apps.appointments.views import (
    AppointmentDetailView,
    AppointmentListCreateView,
    AppointmentLookupView,
    AppointmentTransitionView,
)


urlpatterns = [
    path("", AppointmentListCreateView.as_view(), name="appointment-list-create"),
    path("lookup/", AppointmentLookupView.as_view(), name="appointment-lookup"),
    path(
        "<int:appointment_id>/",
        AppointmentDetailView.as_view(),
        name="appointment-detail",
    ),
    path(
        "<int:appointment_id>/transition/",
        AppointmentTransitionView.as_view(),
        name="appointment-transition",
    ),
]
