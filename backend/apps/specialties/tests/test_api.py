from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.doctors.models import Doctor
from apps.specialties.models import Specialty


class SpecialtyApiTests(APITestCase):
    """Kiểm tra public read và quyền quản trị chuyên khoa."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin-specialty",
            password="AdminPass123!",
            full_name="Admin Specialty",
            role=User.Role.ADMIN,
        )
        self.employee = User.objects.create_user(
            username="employee-specialty",
            password="EmployeePass123!",
            full_name="Employee Specialty",
            role=User.Role.EMPLOYEE,
        )
        self.active = Specialty.objects.create(
            name="Tim mạch",
            description="Điều trị bệnh tim mạch",
        )
        self.inactive = Specialty.objects.create(
            name="Chuyên khoa ẩn",
            is_active=False,
        )

    def test_public_only_returns_active_without_contact_fields(self):
        response = self.client.get("/api/v1/specialties/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["results"]], [self.active.id])
        self.assertNotIn("phone", response.data["results"][0])
        self.assertNotIn("email", response.data["results"][0])

    def test_public_detail_hides_inactive_specialty(self):
        response = self.client.get(f"/api/v1/specialties/{self.inactive.id}/")

        self.assertEqual(response.status_code, 404)

    def test_employee_cannot_access_admin_specialties(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get("/api/v1/admin/specialties/")

        self.assertEqual(response.status_code, 403)

    def test_anonymous_cannot_access_admin_specialties(self):
        response = self.client.get("/api/v1/admin/specialties/")

        self.assertEqual(response.status_code, 401)

    def test_admin_can_create_update_and_list_inactive_specialties(self):
        self.client.force_authenticate(user=self.admin)
        create_response = self.client.post(
            "/api/v1/admin/specialties/",
            {
                "name": "Nội tổng hợp",
                "description": "Chuyên khoa nội",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        specialty_id = create_response.data["id"]

        patch_response = self.client.patch(
            f"/api/v1/admin/specialties/{specialty_id}/",
            {"description": "Mô tả mới"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["description"], "Mô tả mới")

        list_response = self.client.get("/api/v1/admin/specialties/")
        ids = {item["id"] for item in list_response.data["results"]}
        self.assertIn(self.inactive.id, ids)
        self.assertNotIn("phone", list_response.data["results"][0])
        self.assertNotIn("email", list_response.data["results"][0])

    def test_specialty_list_uses_default_page_size_ten(self):
        for index in range(10):
            Specialty.objects.create(name=f"Chuyên khoa {index}")

        first = self.client.get("/api/v1/specialties/")
        second = self.client.get("/api/v1/specialties/", {"page": 2})

        self.assertEqual(first.data["count"], 11)
        self.assertEqual(len(first.data["results"]), 10)
        self.assertEqual(len(second.data["results"]), 1)

    def test_name_is_unique_case_insensitively(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/v1/admin/specialties/",
            {"name": "  TIM MẠCH  "},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_delete_soft_deactivates_specialty(self):
        specialty = Specialty.objects.create(name="Da liễu")
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            f"/api/v1/admin/specialties/{specialty.id}/"
        )

        self.assertEqual(response.status_code, 204)
        specialty.refresh_from_db()
        self.assertFalse(specialty.is_active)

    def test_cannot_deactivate_specialty_with_active_doctor(self):
        Doctor.objects.create(
            specialty=self.active,
            full_name="Bác sĩ A",
            phone="0901234567",
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            f"/api/v1/admin/specialties/{self.active.id}/"
        )

        self.assertEqual(response.status_code, 409)
        self.active.refresh_from_db()
        self.assertTrue(self.active.is_active)

    def test_patch_cannot_bypass_active_doctor_guard(self):
        Doctor.objects.create(
            specialty=self.active,
            full_name="Bác sĩ B",
            phone="0907654321",
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/api/v1/admin/specialties/{self.active.id}/",
            {"is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.active.refresh_from_db()
        self.assertTrue(self.active.is_active)
