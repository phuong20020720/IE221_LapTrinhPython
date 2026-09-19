from django.urls import path

from apps.doctors.views import (
    AdminDoctorDetailView,
    AdminDoctorListCreateView,
    AdminDoctorProfileImageView,
)


urlpatterns = [
    path("", AdminDoctorListCreateView.as_view(), name="admin-doctor-list"),
    path(
        "<int:doctor_id>/",
        AdminDoctorDetailView.as_view(),
        name="admin-doctor-detail",
    ),
    path(
        "<int:doctor_id>/profile-image/",
        AdminDoctorProfileImageView.as_view(),
        name="admin-doctor-profile-image",
    ),
]
