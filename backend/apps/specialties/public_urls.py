from django.urls import path

from apps.specialties.views import (
    PublicSpecialtyDetailView,
    PublicSpecialtyListView,
)


urlpatterns = [
    path("", PublicSpecialtyListView.as_view(), name="public-specialty-list"),
    path(
        "<int:specialty_id>/",
        PublicSpecialtyDetailView.as_view(),
        name="public-specialty-detail",
    ),
]
