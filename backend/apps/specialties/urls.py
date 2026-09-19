from django.urls import path

from apps.specialties.views import SpecialtyListView


urlpatterns = [
    path("", SpecialtyListView.as_view(), name="specialty-list"),
]
