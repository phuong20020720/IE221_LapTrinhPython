from django.urls import path

from apps.specialties.views import (
    AdminSpecialtyDetailView,
    AdminSpecialtyListCreateView,
)


urlpatterns = [
    path("", AdminSpecialtyListCreateView.as_view(), name="admin-specialty-list"),
    path(
        "<int:specialty_id>/",
        AdminSpecialtyDetailView.as_view(),
        name="admin-specialty-detail",
    ),
]
