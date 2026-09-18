from django.urls import path

from apps.patients.views import PatientDetailView, PatientListCreateView


urlpatterns = [
    path("", PatientListCreateView.as_view(), name="patient-list-create"),
    path("<int:patient_id>/", PatientDetailView.as_view(), name="patient-detail"),
]
