from django.urls import path

from apps.doctors.views import DoctorListView


urlpatterns = [
    path("", DoctorListView.as_view(), name="doctor-list"),
]
