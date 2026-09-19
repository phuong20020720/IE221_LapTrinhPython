"""The CHECK constraints must reject bad data even when the service layer is bypassed."""

from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.appointments.models import Appointment
from apps.appointments.tests.factories import (
    make_doctor,
    make_specialty,
    tomorrow,
)
from apps.patients.services import create_patient


class AppointmentConstraintTests(TestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)
        self.patient = create_patient(full_name="Nguyen Van A", phone="0901234567")

    def _create(self, **overrides):
        data = {
            "patient": self.patient,
            "specialty": self.specialty,
            "doctor": self.doctor,
            "appointment_date": tomorrow(),
            "session": Appointment.Session.MORNING,
            "reason": "Kham",
            "status": Appointment.Status.CONFIRMED,
        }
        data.update(overrides)
        with transaction.atomic():
            return Appointment.objects.create(**data)

    def test_invalid_session_is_rejected_by_database(self):
        with self.assertRaises(IntegrityError):
            self._create(session="EVENING")

    def test_invalid_status_is_rejected_by_database(self):
        with self.assertRaises(IntegrityError):
            self._create(status="ARCHIVED")

    def test_cancelled_without_reason_is_rejected_by_database(self):
        with self.assertRaises(IntegrityError):
            self._create(status=Appointment.Status.CANCELLED)

    def test_confirmed_without_doctor_is_rejected_by_database(self):
        with self.assertRaises(IntegrityError):
            self._create(doctor=None, status=Appointment.Status.CONFIRMED)

    def test_pending_assignment_without_doctor_is_allowed(self):
        appointment = self._create(
            doctor=None,
            status=Appointment.Status.PENDING_ASSIGNMENT,
        )
        self.assertIsNone(appointment.doctor_id)

    def test_duplicate_doctor_date_session_is_allowed(self):
        """The MVP deliberately allows several bookings per doctor/date/session."""
        first = self._create()
        second = self._create()
        self.assertNotEqual(first.pk, second.pk)

    def test_booking_code_is_unique(self):
        first = self._create()
        with self.assertRaises(IntegrityError):
            self._create(booking_code=first.booking_code)
