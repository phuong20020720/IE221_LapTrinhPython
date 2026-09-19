from unittest.mock import patch

from django.db import IntegrityError
from django.test import SimpleTestCase, TestCase, TransactionTestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.patients.models import Patient
from apps.patients.phone import normalize_phone
from apps.patients.services import (
    create_patient,
    get_or_create_patient_by_phone,
    update_patient,
)


class PhoneNormalizeTests(SimpleTestCase):
    def test_normalize_strips_and_converts_country_code(self):
        self.assertEqual(normalize_phone("+84 901-234-567"), "0901234567")
        self.assertEqual(normalize_phone("0901234567"), "0901234567")

    def test_normalize_rejects_invalid_phone(self):
        with self.assertRaises(ValidationError):
            normalize_phone("12345")


class PatientServiceTests(TestCase):
    def test_create_normalizes_phone(self):
        patient = create_patient(
            full_name="Nguyen Van A",
            phone="+84 901 234 567",
            email="a@example.com",
        )
        self.assertEqual(patient.phone, "0901234567")

    def test_update_does_not_overwrite_email_with_blank(self):
        patient = create_patient(
            full_name="Nguyen Van A",
            phone="0901234567",
            email="a@example.com",
        )
        updated = update_patient(patient_id=patient.id, email="")
        self.assertEqual(updated.email, "a@example.com")

    def test_get_or_create_creates_new_patient(self):
        patient, created = get_or_create_patient_by_phone(
            full_name="Nguyen Van A",
            phone="+84 901 234 567",
            email="a@example.com",
        )
        self.assertTrue(created)
        self.assertEqual(patient.phone, "0901234567")
        self.assertEqual(patient.full_name, "Nguyen Van A")

    def test_get_or_create_reuses_existing_and_updates_latest_non_blank_data(self):
        original = create_patient(
            full_name="Nguyen Van A",
            phone="0901234567",
            email="a@example.com",
        )
        patient, created = get_or_create_patient_by_phone(
            full_name="Ten Khac",
            phone="+84 901-234-567",
            email="new@example.com",
        )
        self.assertFalse(created)
        self.assertEqual(patient.id, original.id)
        self.assertEqual(patient.full_name, "Ten Khac")
        self.assertEqual(patient.email, "new@example.com")
        self.assertEqual(Patient.objects.filter(phone="0901234567").count(), 1)

    def test_get_or_create_does_not_replace_existing_email_with_blank(self):
        original = create_patient(
            full_name="Nguyen Van A",
            phone="0901234567",
            email="a@example.com",
        )
        patient, created = get_or_create_patient_by_phone(
            full_name="Ten Khac",
            phone="0901234567",
            email="",
        )
        self.assertFalse(created)
        self.assertEqual(patient.id, original.id)
        self.assertEqual(patient.full_name, "Ten Khac")
        self.assertEqual(patient.email, "a@example.com")


class PatientGetOrCreateRaceTests(TransactionTestCase):
    def test_integrity_error_falls_back_to_existing_patient(self):
        existing = Patient.objects.create(
            full_name="Nguyen Van A",
            phone="0901234567",
            email="a@example.com",
        )

        # Giả lập race: lần filter đầu không thấy bản ghi, create bị unique conflict.
        with patch(
            "apps.patients.services.Patient.objects.filter",
            return_value=Patient.objects.none(),
        ):
            with patch(
                "apps.patients.services.Patient.objects.create",
                side_effect=IntegrityError("duplicate phone"),
            ):
                patient, created = get_or_create_patient_by_phone(
                    full_name="Ten Khac",
                    phone="0901234567",
                    email="",
                )

        self.assertFalse(created)
        self.assertEqual(patient.id, existing.id)
        self.assertEqual(patient.full_name, "Ten Khac")
        self.assertEqual(patient.email, "a@example.com")


class PatientApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin1",
            password="AdminPass123!",
            full_name="Admin One",
            role=User.Role.ADMIN,
        )
        self.employee = User.objects.create_user(
            username="emp1",
            password="EmpPass123!",
            full_name="Employee One",
            role=User.Role.EMPLOYEE,
        )
        self.patient = Patient.objects.create(
            full_name="Tran Thi B",
            phone="0912345678",
            email="b@example.com",
        )

    def test_anonymous_cannot_access_patients(self):
        response = self.client.get("/api/v1/patients/")
        self.assertEqual(response.status_code, 401)

    def test_employee_can_search_patients_by_name_or_phone(self):
        self.client.force_authenticate(user=self.employee)
        by_name = self.client.get("/api/v1/patients/", {"q": "Tran"})
        self.assertEqual(by_name.status_code, 200)
        self.assertEqual(len(by_name.data["results"]), 1)

        by_phone = self.client.get("/api/v1/patients/", {"q": "+84 912 345 678"})
        self.assertEqual(by_phone.status_code, 200)
        self.assertEqual(len(by_phone.data["results"]), 1)
        self.assertEqual(by_phone.data["results"][0]["phone"], "0912345678")

    def test_patient_list_uses_default_page_size_ten(self):
        for index in range(10):
            Patient.objects.create(
                full_name=f"Bệnh nhân {index}",
                phone=f"09000000{index:02d}",
            )
        self.client.force_authenticate(user=self.employee)

        first = self.client.get("/api/v1/patients/", {"include_inactive": "true"})
        second = self.client.get(
            "/api/v1/patients/", {"include_inactive": "true", "page": 2}
        )

        self.assertEqual(first.data["count"], 11)
        self.assertEqual(len(first.data["results"]), 10)
        self.assertEqual(len(second.data["results"]), 1)

    def test_employee_can_create_and_update_patient(self):
        self.client.force_authenticate(user=self.employee)
        create_response = self.client.post(
            "/api/v1/patients/",
            {
                "family_name": "Le",
                "given_name": "Van C",
                "phone": "0987654321",
                "email": "c@example.com",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.data["full_name"], "Le Van C")
        patient_id = create_response.data["id"]

        patch_response = self.client.patch(
            f"/api/v1/patients/{patient_id}/",
            {"family_name": "Le", "given_name": "Van Cuong"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["full_name"], "Le Van Cuong")

    def test_can_reactivate_inactive_patient(self):
        self.patient.is_active = False
        self.patient.save(update_fields=["is_active"])
        self.client.force_authenticate(user=self.employee)
        response = self.client.patch(
            f"/api/v1/patients/{self.patient.id}/",
            {"is_active": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_active"])

    def test_delete_soft_deactivates_patient(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/v1/patients/{self.patient.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_active"])
