from django.urls import path

from apps.doctors.views import PublicDoctorDetailView, PublicDoctorListView


urlpatterns = [
    path("", PublicDoctorListView.as_view(), name="public-doctor-list"),
    path(
        "<int:doctor_id>/",
        PublicDoctorDetailView.as_view(),
        name="public-doctor-detail",
    ),
]
