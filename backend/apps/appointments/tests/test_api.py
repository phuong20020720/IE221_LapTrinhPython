from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.appointments.tests.factories import (
    book,
    make_doctor,
    make_employee,
    make_specialty,
    tomorrow,
)
from apps.patients.models import Patient


class PublicBookingApiTests(APITestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)
        self.url = reverse("appointment-list-create")

    def payload(self, **overrides):
        data = {
            "full_name": "Nguyen Van A",
            "phone": "0901234567",
            "email": "a@example.com",
            "specialty_id": self.specialty.pk,
            "doctor_id": self.doctor.pk,
            "appointment_date": tomorrow().isoformat(),
            "session": "MORNING",
            "reason": "Kham tong quat",
        }
        data.update(overrides)
        return data

    def test_anonymous_can_book_and_receives_booking_code(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("booking_code", response.data)
        self.assertEqual(response.data["status"], Appointment.Status.CONFIRMED)
        self.assertEqual(Patient.objects.count(), 1)

    def test_booking_without_doctor_returns_pending_assignment(self):
        response = self.client.post(
            self.url,
            self.payload(doctor_id=None),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["status"],
            Appointment.Status.PENDING_ASSIGNMENT,
        )
        self.assertIsNone(response.data["doctor_name"])

    def test_booking_response_hides_internal_fields(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertNotIn("reason", response.data)
        self.assertNotIn("id", response.data)
        self.assertNotIn("patient", response.data)

    def test_booking_with_past_date_returns_400(self):
        response = self.client.post(
            self.url,
            self.payload(appointment_date="2020-01-01"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("appointment_date", response.data)

    def test_booking_with_mismatched_doctor_returns_400(self):
        other = make_doctor(make_specialty("Tim mạch"), full_name="BS Khac")
        response = self.client.post(
            self.url,
            self.payload(doctor_id=other.pk),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("doctor_id", response.data)

    def test_booking_with_invalid_session_returns_400(self):
        response = self.client.post(
            self.url,
            self.payload(session="EVENING"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_listing_appointments_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertIn(
            response.status_code,
            {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN},
        )


class PublicLookupApiTests(APITestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)
        self.url = reverse("appointment-lookup")

    def test_lookup_by_code_is_public(self):
        appointment = book(self.specialty, doctor=self.doctor)
        response = self.client.get(
            self.url,
            {"booking_code": str(appointment.booking_code)},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["doctor_name"], self.doctor.full_name)

    def test_lookup_by_phone_returns_only_that_patient(self):
        book(self.specialty, phone="0901234567")
        book(self.specialty, phone="0901234568")
        response = self.client.get(self.url, {"phone": "0901234567"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_lookup_without_criteria_returns_400(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_lookup_miss_returns_404_without_leaking_data(self):
        book(self.specialty)
        response = self.client.get(self.url, {"phone": "0909999999"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_lookup_never_exposes_reason_or_patient_identity(self):
        appointment = book(self.specialty, doctor=self.doctor)
        response = self.client.get(
            self.url,
            {"booking_code": str(appointment.booking_code)},
        )
        row = response.data[0]
        self.assertNotIn("reason", row)
        self.assertNotIn("patient_name", row)
        self.assertNotIn("patient_phone", row)


class EmployeeAppointmentApiTests(APITestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)
        self.employee = make_employee()
        self.client.force_authenticate(self.employee)

    def test_employee_can_filter_by_date_doctor_and_status(self):
        appointment = book(self.specialty, doctor=self.doctor)
        book(self.specialty, phone="0901234568")

        url = reverse("appointment-list-create")
        response = self.client.get(url, {"doctor_id": self.doctor.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [row["id"] for row in response.data["results"]],
            [appointment.pk],
        )

        response = self.client.get(url, {"status": "PENDING_ASSIGNMENT"})
        self.assertEqual(response.data["count"], 1)

        response = self.client.get(
            url,
            {"date": appointment.appointment_date.isoformat()},
        )
        self.assertEqual(response.data["count"], 2)

    def test_list_response_is_paginated(self):
        for i in range(24):
            book(self.specialty, phone=f"09020000{i:02d}")

        url = reverse("appointment-list-create")
        first = self.client.get(url, {"page_size": 10})
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(len(first.data["results"]), 10)
        self.assertEqual(first.data["count"], 24)
        self.assertEqual(first.data["page"], 1)
        self.assertEqual(first.data["total_pages"], 3)

        last = self.client.get(url, {"page_size": 10, "page": 3})
        self.assertEqual(len(last.data["results"]), 4)
        self.assertEqual(last.data["page"], 3)

    def test_out_of_range_page_does_not_error(self):
        book(self.specialty, doctor=self.doctor)
        response = self.client.get(
            reverse("appointment-list-create"),
            {"page": 999},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["page"], 1)

    def test_employee_sees_internal_fields(self):
        appointment = book(self.specialty, doctor=self.doctor)
        response = self.client.get(
            reverse("appointment-detail", args=[appointment.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reason"], "Kham tong quat")
        self.assertEqual(response.data["patient_phone"], "0901234567")

    def test_employee_can_assign_doctor_then_confirm(self):
        appointment = book(self.specialty)
        response = self.client.patch(
            reverse("appointment-detail", args=[appointment.pk]),
            {"doctor_id": self.doctor.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            reverse("appointment-transition", args=[appointment.pk]),
            {"status": "CONFIRMED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "CONFIRMED")

    def test_confirming_without_doctor_returns_400(self):
        appointment = book(self.specialty)
        response = self.client.post(
            reverse("appointment-transition", args=[appointment.pk]),
            {"status": "CONFIRMED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("doctor_id", response.data)

    def test_illegal_transition_returns_400(self):
        appointment = book(self.specialty, doctor=self.doctor)
        response = self.client.post(
            reverse("appointment-transition", args=[appointment.pk]),
            {"status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_cancel_requires_reason(self):
        appointment = book(self.specialty, doctor=self.doctor)
        response = self.client.post(
            reverse("appointment-transition", args=[appointment.pk]),
            {"status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_cancels_instead_of_destroying(self):
        appointment = book(self.specialty, doctor=self.doctor)
        response = self.client.delete(
            reverse("appointment-detail", args=[appointment.pk]),
            {"cancellation_reason": "NO_SHOW"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.Status.CANCELLED)
        self.assertEqual(appointment.cancellation_reason, "NO_SHOW")
        self.assertEqual(Appointment.objects.count(), 1)

    def test_missing_appointment_returns_404(self):
        response = self.client.get(reverse("appointment-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PermissionBoundaryTests(APITestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.appointment = book(self.specialty)

    def test_anonymous_cannot_read_detail(self):
        response = self.client.get(
            reverse("appointment-detail", args=[self.appointment.pk])
        )
        self.assertIn(
            response.status_code,
            {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN},
        )

    def test_anonymous_cannot_transition(self):
        response = self.client.post(
            reverse("appointment-transition", args=[self.appointment.pk]),
            {"status": "CANCELLED", "cancellation_reason": "CLINIC"},
            format="json",
        )
        self.assertIn(
            response.status_code,
            {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN},
        )

    def test_admin_has_employee_rights(self):
        from apps.accounts.models import User

        admin = make_employee(username="admin01", role=User.Role.ADMIN)
        self.client.force_authenticate(admin)
        response = self.client.get(reverse("appointment-list-create"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
