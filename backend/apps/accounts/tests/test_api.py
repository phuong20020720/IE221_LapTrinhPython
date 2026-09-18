from rest_framework.test import APITestCase

from apps.accounts.models import User


class AuthApiTests(APITestCase):
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

    def test_login_returns_tokens_and_user_payload(self):
        response = self.client.post(
            "/api/v1/auth/token/",
            {"username": "emp1", "password": "EmpPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["role"], "EMPLOYEE")
        self.assertEqual(response.data["user"]["full_name"], "Employee One")

    def test_me_requires_authentication(self):
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_returns_current_user(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "emp1")
        self.assertEqual(response.data["role"], "EMPLOYEE")


class EmployeeApiTests(APITestCase):
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

    def test_employee_cannot_manage_employees(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/v1/employees/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_create_and_list_employees(self):
        self.client.force_authenticate(user=self.admin)
        create_response = self.client.post(
            "/api/v1/employees/",
            {
                "username": "emp2",
                "last_name": "Nguyen",
                "first_name": "Van B",
                "password": "EmpPass123!",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.data["role"], "EMPLOYEE")
        self.assertEqual(create_response.data["last_name"], "Nguyen")
        self.assertEqual(create_response.data["first_name"], "Van B")
        self.assertEqual(create_response.data["full_name"], "Nguyen Van B")

        list_response = self.client.get("/api/v1/employees/")
        self.assertEqual(list_response.status_code, 200)
        usernames = {item["username"] for item in list_response.data}
        self.assertIn("emp1", usernames)
        self.assertIn("emp2", usernames)

    def test_admin_can_soft_delete_employee(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/v1/employees/{self.employee.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_active"])
        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_active)

    def test_inactive_employee_cannot_login(self):
        self.employee.is_active = False
        self.employee.save(update_fields=["is_active"])
        response = self.client.post(
            "/api/v1/auth/token/",
            {"username": "emp1", "password": "EmpPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
