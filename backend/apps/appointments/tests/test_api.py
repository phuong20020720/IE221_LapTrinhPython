from datetime import timedelta

from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.specialties.models import Specialty


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AppointmentApiTests(APITestCase):
    """Kiểm tra đặt lịch, email, phân quyền và state machine lịch hẹn."""

    def setUp(self):
        self.today = timezone.localdate()
        self.future_date = self.today + timedelta(days=3)
        self.specialty = Specialty.objects.create(name="Tim mạch")
        self.other_specialty = Specialty.objects.create(name="Tai Mũi Họng")
        self.doctor = Doctor.objects.create(
            specialty=self.specialty,
            full_name="BS Nguyễn An",
            phone="0901111111",
            email="doctor@example.com",
        )
        self.other_doctor = Doctor.objects.create(
            specialty=self.other_specialty,
            full_name="BS Trần Bình",
            phone="0902222222",
        )
        self.employee = User.objects.create_user(
            username="appointment-employee",
            password="EmployeePass123!",
            full_name="Nhân viên lịch hẹn",
            role=User.Role.EMPLOYEE,
        )
        self.admin = User.objects.create_user(
            username="appointment-admin",
            password="AdminPass123!",
            full_name="Quản trị lịch hẹn",
            role=User.Role.ADMIN,
        )

    def payload(self, **overrides):
        data = {
            "full_name": "Nguyễn Văn Khách",
            "phone": "+84 903 456 789",
            "email": "customer@example.com",
            "specialty_id": self.specialty.id,
            "doctor_id": self.doctor.id,
            "appointment_date": self.future_date.isoformat(),
            "session": "MORNING",
            "reason": "Khám đau ngực",
        }
        data.update(overrides)
        return data

    def create_appointment(self, **overrides):
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(
                "/api/v1/appointments/",
                self.payload(**overrides),
                format="json",
            )

    def test_public_creates_confirmed_appointment_and_sends_email(self):
        response = self.create_appointment()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "CONFIRMED")
        appointment = Appointment.objects.get()
        self.assertEqual(appointment.patient.phone, "0903456789")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["customer@example.com"])
        self.assertTrue(mail.outbox[0].subject.startswith("Medicare - Xác nhận lịch hẹn"))
        self.assertIn(str(appointment.booking_code), mail.outbox[0].body)
        self.assertIn("0903456789", mail.outbox[0].body)
        self.assertEqual(len(mail.outbox[0].alternatives), 1)
        html, mimetype = mail.outbox[0].alternatives[0]
        self.assertEqual(mimetype, "text/html")
        self.assertIn("Phòng khám Medicare", html)
        self.assertIn("Lưu ý khi đến khám", html)
        self.assertIn(str(appointment.booking_code), html)

    def test_public_can_create_without_doctor(self):
        response = self.create_appointment(doctor_id=None)

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.data["doctor"])
        self.assertIsNone(Appointment.objects.get().doctor_id)

    def test_existing_patient_is_reused_and_latest_contact_is_saved(self):
        patient = Patient.objects.create(
            full_name="Tên cũ",
            phone="0903456789",
            email="old@example.com",
        )

        response = self.create_appointment(
            full_name="Tên mới",
            email="new@example.com",
        )

        self.assertEqual(response.status_code, 201)
        patient.refresh_from_db()
        self.assertEqual(Patient.objects.count(), 1)
        self.assertEqual(patient.full_name, "Tên mới")
        self.assertEqual(patient.email, "new@example.com")
        self.assertEqual(mail.outbox[0].to, ["new@example.com"])

    def test_create_rejects_missing_email_past_date_and_wrong_doctor(self):
        missing_email = self.payload()
        missing_email.pop("email")
        response = self.client.post("/api/v1/appointments/", missing_email, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

        response = self.create_appointment(
            appointment_date=(self.today - timedelta(days=1)).isoformat()
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("appointment_date", response.data)

        response = self.create_appointment(doctor_id=self.other_doctor.id)
        self.assertEqual(response.status_code, 400)
        self.assertIn("doctor_id", response.data)

    def test_public_lookup_endpoint_is_not_available(self):
        self.create_appointment()

        self.assertEqual(
            self.client.get("/api/v1/appointments/lookup/", {"phone": "0903456789"}).status_code,
            404,
        )

    def test_anonymous_cannot_list_or_read_internal_appointments(self):
        create_response = self.create_appointment()
        appointment = Appointment.objects.get(booking_code=create_response.data["booking_code"])

        self.assertEqual(self.client.get("/api/v1/appointments/").status_code, 401)
        self.assertEqual(
            self.client.get(f"/api/v1/appointments/{appointment.id}/").status_code,
            401,
        )

    def test_employee_can_filter_and_view_appointment_details(self):
        self.create_appointment()
        self.create_appointment(
            phone="0908888888",
            email="other@example.com",
            full_name="Khách khác",
            doctor_id=None,
            session="AFTERNOON",
        )
        self.client.force_authenticate(user=self.employee)

        response = self.client.get(
            "/api/v1/appointments/",
            {"q": "Nguyễn Văn", "session": "MORNING", "status": "CONFIRMED"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["patient"]["email"], "customer@example.com")

    def test_employee_can_use_work_scopes_and_server_pagination(self):
        today_response = self.create_appointment(phone="0903000001", email="today@example.com")
        future_response = self.create_appointment(phone="0903000002", email="future@example.com")
        unassigned_response = self.create_appointment(
            phone="0903000003",
            email="unassigned@example.com",
            doctor_id=None,
        )
        history_response = self.create_appointment(phone="0903000004", email="history@example.com")

        Appointment.objects.filter(booking_code=today_response.data["booking_code"]).update(
            appointment_date=self.today,
        )
        Appointment.objects.filter(booking_code=history_response.data["booking_code"]).update(
            appointment_date=self.today - timedelta(days=1),
            status=Appointment.Status.COMPLETED,
        )
        self.client.force_authenticate(user=self.employee)

        today = self.client.get("/api/v1/appointments/", {"scope": "today"})
        upcoming = self.client.get("/api/v1/appointments/", {"scope": "upcoming"})
        unassigned = self.client.get("/api/v1/appointments/", {"scope": "unassigned"})
        history = self.client.get("/api/v1/appointments/", {"scope": "history"})
        paged = self.client.get(
            "/api/v1/appointments/",
            {"scope": "all", "page": 2, "page_size": 2},
        )

        self.assertEqual(today.data["count"], 1)
        self.assertEqual(today.data["results"][0]["booking_code"], today_response.data["booking_code"])
        self.assertEqual(upcoming.data["count"], 2)
        self.assertEqual(unassigned.data["count"], 1)
        self.assertEqual(
            unassigned.data["results"][0]["booking_code"],
            unassigned_response.data["booking_code"],
        )
        self.assertEqual(history.data["count"], 1)
        self.assertEqual(history.data["results"][0]["booking_code"], history_response.data["booking_code"])
        self.assertEqual(paged.data["count"], 4)
        self.assertEqual(len(paged.data["results"]), 2)
        self.assertIsNotNone(paged.data["previous"])

        self.assertNotEqual(future_response.data["booking_code"], unassigned_response.data["booking_code"])

    def test_valid_status_flow_sets_timestamps(self):
        self.create_appointment()
        appointment = Appointment.objects.get()
        self.client.force_authenticate(user=self.employee)

        start = self.client.patch(
            f"/api/v1/appointments/{appointment.id}/",
            {"status": "IN_PROGRESS"},
            format="json",
        )
        complete = self.client.patch(
            f"/api/v1/appointments/{appointment.id}/",
            {"status": "COMPLETED"},
            format="json",
        )

        self.assertEqual(start.status_code, 200)
        self.assertIsNotNone(start.data["started_at"])
        self.assertEqual(complete.status_code, 200)
        self.assertIsNotNone(complete.data["completed_at"])

    def test_invalid_transition_and_terminal_update_are_rejected(self):
        self.create_appointment()
        appointment = Appointment.objects.get()
        self.client.force_authenticate(user=self.employee)

        direct_complete = self.client.patch(
            f"/api/v1/appointments/{appointment.id}/",
            {"status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(direct_complete.status_code, 400)

        self.client.delete(
            f"/api/v1/appointments/{appointment.id}/",
            {"cancellation_reason": "CLINIC"},
            format="json",
        )
        edit_cancelled = self.client.patch(
            f"/api/v1/appointments/{appointment.id}/",
            {"reason": "Không được sửa"},
            format="json",
        )
        self.assertEqual(edit_cancelled.status_code, 400)

    def test_delete_soft_cancels_with_actor_and_reason(self):
        self.create_appointment()
        appointment = Appointment.objects.get()
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            f"/api/v1/appointments/{appointment.id}/",
            {"cancellation_reason": "NO_SHOW"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, "CANCELLED")
        self.assertEqual(appointment.cancellation_reason, "NO_SHOW")
        self.assertEqual(appointment.cancelled_by, self.admin)
        self.assertIsNotNone(appointment.cancelled_at)

    def test_employee_can_assign_or_clear_doctor(self):
        self.create_appointment(doctor_id=None)
        appointment = Appointment.objects.get()
        self.client.force_authenticate(user=self.employee)

        assigned = self.client.patch(
            f"/api/v1/appointments/{appointment.id}/",
            {"doctor_id": self.doctor.id},
            format="json",
        )
        cleared = self.client.patch(
            f"/api/v1/appointments/{appointment.id}/",
            {"doctor_id": None},
            format="json",
        )

        self.assertEqual(assigned.status_code, 200)
        self.assertEqual(assigned.data["doctor"]["id"], self.doctor.id)
        self.assertEqual(cleared.status_code, 200)
        self.assertIsNone(cleared.data["doctor"])
