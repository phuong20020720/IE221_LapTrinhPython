from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.specialties.models import Specialty


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.employee = User.objects.create_user(
            username="dashboard-employee",
            password="EmployeePass123!",
            full_name="Nhân viên dashboard",
            role=User.Role.EMPLOYEE,
        )
        self.specialty = Specialty.objects.create(name="Nội tổng quát")
        self.doctor = Doctor.objects.create(
            specialty=self.specialty,
            full_name="BS Dashboard",
            phone="0901112222",
        )
        self.patient = Patient.objects.create(
            full_name="Khách Dashboard",
            phone="0903334444",
            email="dashboard@example.com",
        )

    def create_appointment(self, appointment_date, status=Appointment.Status.CONFIRMED):
        return Appointment.objects.create(
            patient=self.patient,
            specialty=self.specialty,
            doctor=self.doctor,
            appointment_date=appointment_date,
            session=Appointment.Session.MORNING,
            reason="Kiểm tra dashboard",
            status=status,
            cancellation_reason=(
                Appointment.CancellationReason.CLINIC
                if status == Appointment.Status.CANCELLED
                else ""
            ),
        )

    def test_dashboard_requires_internal_account(self):
        response = self.client.get("/api/v1/dashboard/summary/")

        self.assertEqual(response.status_code, 401)

    def test_employee_receives_today_week_and_month_aggregates(self):
        week_start = self.today - timedelta(days=self.today.weekday())
        self.create_appointment(self.today)
        first_week_day = week_start if self.today != week_start else week_start + timedelta(days=1)
        last_week_day = week_start + timedelta(days=5)
        if self.today == last_week_day:
            last_week_day = week_start + timedelta(days=4)
        self.create_appointment(first_week_day)
        self.create_appointment(last_week_day)
        self.create_appointment(week_start, status=Appointment.Status.CANCELLED)
        sunday_outside_chart = week_start + timedelta(days=6)
        if sunday_outside_chart == self.today:
            sunday_outside_chart += timedelta(days=7)
        self.create_appointment(sunday_outside_chart)

        previous_month = self.today.replace(day=1) - timedelta(days=1)
        older_patient = Patient.objects.create(
            full_name="Khách tháng trước",
            phone="0905556666",
        )
        Patient.objects.filter(pk=older_patient.pk).update(
            created_at=timezone.make_aware(
                datetime(previous_month.year, previous_month.month, 10, 9, 0),
            ),
        )

        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/v1/dashboard/summary/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["appointments_today"], 1)
        self.assertEqual(response.data["summary"]["appointments_total"], 4)
        self.assertEqual(response.data["summary"]["patients_total"], 2)
        self.assertEqual(response.data["summary"]["doctors_total"], 1)
        self.assertEqual(len(response.data["appointments_by_weekday"]), 6)
        expected_week_total = 3 if self.today.weekday() < 6 else 2
        self.assertEqual(
            sum(item["count"] for item in response.data["appointments_by_weekday"]),
            expected_week_total,
        )
        self.assertEqual(len(response.data["patients_by_month"]), 6)
        self.assertEqual(response.data["patients_by_month"][-2]["count"], 1)
        self.assertEqual(response.data["patients_by_month"][-1]["count"], 1)

    def test_employee_can_query_historical_week_and_month_window(self):
        past_week_reference = self.today - timedelta(days=70)
        past_week_start = past_week_reference - timedelta(days=past_week_reference.weekday())
        self.create_appointment(past_week_start + timedelta(days=2))

        past_month_date = self.today - timedelta(days=150)
        past_month = past_month_date.replace(day=1)
        historical_patient = Patient.objects.create(
            full_name="Khách lịch sử",
            phone="0907778888",
        )
        Patient.objects.filter(pk=historical_patient.pk).update(
            created_at=timezone.make_aware(
                datetime(past_month.year, past_month.month, 12, 9, 0),
            ),
        )

        self.client.force_authenticate(user=self.employee)
        response = self.client.get(
            "/api/v1/dashboard/summary/",
            {
                "week_date": past_week_reference.isoformat(),
                "month": past_month.strftime("%Y-%m"),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            sum(item["count"] for item in response.data["appointments_by_weekday"]),
            1,
        )
        self.assertEqual(response.data["patients_by_month"][-1]["month"], past_month.strftime("%Y-%m"))
        self.assertEqual(response.data["patients_by_month"][-1]["count"], 1)

    def test_dashboard_accepts_future_periods(self):
        future = self.today + timedelta(days=40)
        future_week_start = future - timedelta(days=future.weekday())
        self.create_appointment(future_week_start + timedelta(days=2))
        self.client.force_authenticate(user=self.employee)

        response = self.client.get(
            "/api/v1/dashboard/summary/",
            {"week_date": future.isoformat(), "month": future.strftime("%Y-%m")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            sum(item["count"] for item in response.data["appointments_by_weekday"]),
            1,
        )
