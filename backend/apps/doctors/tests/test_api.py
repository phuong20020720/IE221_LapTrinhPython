import json
from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.doctors.models import Doctor, DoctorExpertise
from apps.doctors.serializers import DoctorCreateSerializer, MAX_IMAGE_SIZE
from apps.specialties.models import Specialty


def make_png(name: str = "doctor.png") -> SimpleUploadedFile:
    """Tạo ảnh PNG nhỏ, hợp lệ cho test upload."""
    stream = BytesIO()
    Image.new("RGB", (10, 10), color="white").save(stream, format="PNG")
    return SimpleUploadedFile(name, stream.getvalue(), content_type="image/png")


class DoctorApiTests(APITestCase):
    """Kiểm tra public read, Admin CRUD, upload và soft delete bác sĩ."""

    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.settings_override = override_settings(
            MEDIA_ROOT=self.media_directory.name,
            MEDIA_URL="/media/",
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.addCleanup(self.media_directory.cleanup)

        self.admin = User.objects.create_user(
            username="admin-doctor",
            password="AdminPass123!",
            full_name="Admin Doctor",
            role=User.Role.ADMIN,
        )
        self.employee = User.objects.create_user(
            username="employee-doctor",
            password="EmployeePass123!",
            full_name="Employee Doctor",
            role=User.Role.EMPLOYEE,
        )
        self.specialty = Specialty.objects.create(name="Tai Mũi Họng")
        self.other_specialty = Specialty.objects.create(name="Tim mạch")
        self.doctor = Doctor.objects.create(
            specialty=self.specialty,
            full_name="Nguyễn Văn An",
            credentials="BS.CKII",
            position="Trưởng khoa",
            years_of_experience=12,
            phone="0901234567",
            email="doctor@example.com",
            professional_description="Bác sĩ chuyên khoa.",
        )
        DoctorExpertise.objects.create(
            doctor=self.doctor,
            expertise_name="Nội soi",
            display_order=0,
        )

    def test_public_can_search_and_filter_active_doctors(self):
        Doctor.objects.create(
            specialty=self.other_specialty,
            full_name="Bác sĩ khác",
            phone="0911111111",
        )
        Doctor.objects.create(
            specialty=self.specialty,
            full_name="Bác sĩ đã ẩn",
            phone="0922222222",
            is_active=False,
        )

        response = self.client.get(
            "/api/v1/doctors/",
            {"q": "Nguyễn", "specialty_id": self.specialty.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], self.doctor.id)
        self.assertEqual(response.data["results"][0]["specialty"]["id"], self.specialty.id)
        self.assertEqual(response.data["results"][0]["expertises"][0]["expertise_name"], "Nội soi")
        self.assertNotIn("phone", response.data["results"][0])
        self.assertNotIn("email", response.data["results"][0])

    def test_public_hides_doctor_in_inactive_specialty(self):
        self.specialty.is_active = False
        self.specialty.save(update_fields=["is_active"])

        list_response = self.client.get("/api/v1/doctors/")
        detail_response = self.client.get(f"/api/v1/doctors/{self.doctor.id}/")

        self.assertEqual(list_response.data["results"], [])
        self.assertEqual(detail_response.status_code, 404)

    def test_doctor_list_uses_default_page_size_ten(self):
        for index in range(10):
            Doctor.objects.create(
                specialty=self.specialty,
                full_name=f"Bác sĩ {index}",
                phone=f"09000000{index:02d}",
            )

        first = self.client.get("/api/v1/doctors/")
        second = self.client.get("/api/v1/doctors/", {"page": 2})

        self.assertEqual(first.data["count"], 11)
        self.assertEqual(len(first.data["results"]), 10)
        self.assertEqual(len(second.data["results"]), 1)

    def test_employee_cannot_access_admin_doctors(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get("/api/v1/admin/doctors/")

        self.assertEqual(response.status_code, 403)

    def test_admin_can_create_doctor_with_expertises(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/v1/admin/doctors/",
            {
                "specialty_id": self.specialty.id,
                "full_name": "Trần Thị Bình",
                "phone": "0987654321",
                "email": "binh@example.com",
                "years_of_experience": 8,
                "expertises": [
                    {
                        "expertise_name": "Phẫu thuật",
                        "description": "Chuyên sâu",
                        "display_order": 1,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["phone"], "0987654321")
        self.assertEqual(response.data["expertises"][0]["expertise_name"], "Phẫu thuật")

    def test_admin_can_upload_profile_image_with_multipart_expertises(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/v1/admin/doctors/",
            {
                "specialty_id": str(self.specialty.id),
                "full_name": "Lê Văn Cường",
                "phone": "0977777777",
                "profile_image": make_png(),
                "expertises": json.dumps(
                    [{"expertise_name": "Nội khoa", "display_order": 0}]
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("/media/doctors/", response.data["profile_image_url"])
        self.assertEqual(response.data["expertises"][0]["expertise_name"], "Nội khoa")

    def test_rejects_non_image_upload(self):
        self.client.force_authenticate(user=self.admin)
        invalid_file = SimpleUploadedFile(
            "payload.pdf",
            b"not an image",
            content_type="application/pdf",
        )

        response = self.client.post(
            "/api/v1/admin/doctors/",
            {
                "specialty_id": self.specialty.id,
                "full_name": "Bác sĩ file lỗi",
                "phone": "0966666666",
                "profile_image": invalid_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("profile_image", response.data)

    def test_rejects_profile_image_larger_than_five_megabytes(self):
        image = make_png()
        image.size = MAX_IMAGE_SIZE + 1
        serializer = DoctorCreateSerializer(
            data={
                "specialty_id": self.specialty.id,
                "full_name": "Bác sĩ ảnh lớn",
                "phone": "0944444444",
                "profile_image": image,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("profile_image", serializer.errors)

    def test_cannot_create_doctor_in_inactive_specialty(self):
        self.other_specialty.is_active = False
        self.other_specialty.save(update_fields=["is_active"])
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/v1/admin/doctors/",
            {
                "specialty_id": self.other_specialty.id,
                "full_name": "Bác sĩ không hợp lệ",
                "phone": "0955555555",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("specialty_id", response.data)

    def test_patch_replaces_expertises_and_can_clear_experience(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/api/v1/admin/doctors/{self.doctor.id}/",
            {
                "years_of_experience": None,
                "expertises": [
                    {"expertise_name": "Phẫu thuật tai", "display_order": 2}
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["years_of_experience"])
        self.assertEqual(len(response.data["expertises"]), 1)
        self.assertEqual(response.data["expertises"][0]["expertise_name"], "Phẫu thuật tai")

    def test_delete_soft_deactivates_doctor(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(f"/api/v1/admin/doctors/{self.doctor.id}/")

        self.assertEqual(response.status_code, 204)
        self.doctor.refresh_from_db()
        self.assertFalse(self.doctor.is_active)

    def test_cannot_reactivate_doctor_in_inactive_specialty(self):
        self.doctor.is_active = False
        self.doctor.save(update_fields=["is_active"])
        self.specialty.is_active = False
        self.specialty.save(update_fields=["is_active"])
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/api/v1/admin/doctors/{self.doctor.id}/",
            {"is_active": True},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data.get("is_active", False))

    def test_admin_can_remove_profile_image(self):
        self.doctor.profile_image = make_png()
        self.doctor.save(update_fields=["profile_image"])
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            f"/api/v1/admin/doctors/{self.doctor.id}/profile-image/"
        )

        self.assertEqual(response.status_code, 204)
        self.doctor.refresh_from_db()
        self.assertFalse(self.doctor.profile_image)
