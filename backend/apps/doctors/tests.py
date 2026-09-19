from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.tests.factories import make_doctor, make_specialty


class ProvisionalCatalogApiTests(APITestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.other = make_specialty("Tim mạch")
        self.doctor = make_doctor(self.specialty)
        make_doctor(self.other, full_name="BS Tim")
        make_doctor(self.specialty, full_name="BS Nghi", is_active=False)

    def test_specialty_list_is_public_and_hides_inactive(self):
        make_specialty("Da liễu", is_active=False)
        response = self.client.get(reverse("specialty-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {row["name"] for row in response.data}
        self.assertNotIn("Da liễu", names)

    def test_doctor_list_hides_inactive(self):
        response = self.client.get(reverse("doctor-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {row["full_name"] for row in response.data}
        self.assertNotIn("BS Nghi", names)

    def test_doctor_list_filters_by_specialty(self):
        response = self.client.get(
            reverse("doctor-list"),
            {"specialty_id": self.specialty.pk},
        )
        self.assertEqual([row["id"] for row in response.data], [self.doctor.pk])
