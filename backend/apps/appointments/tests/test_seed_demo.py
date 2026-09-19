from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from apps.appointments.management.commands.seed_demo import (
    DOCTORS,
    PATIENTS,
    SPECIALTIES,
)
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.specialties.models import Specialty


User = get_user_model()


class SeedDemoCommandTests(TestCase):
    def seed(self, *args):
        out = StringIO()
        call_command("seed_demo", *args, stdout=out)
        return out.getvalue()

    def test_seed_creates_every_status(self):
        self.seed()

        present = set(Appointment.objects.values_list("status", flat=True))
        self.assertEqual(present, set(Appointment.Status.values))

    def test_seed_creates_the_supporting_records(self):
        self.seed()

        self.assertEqual(Specialty.objects.count(), len(SPECIALTIES))
        self.assertEqual(Doctor.objects.count(), len(DOCTORS))
        self.assertEqual(Patient.objects.count(), len(PATIENTS))
        self.assertTrue(Specialty.objects.filter(is_active=False).exists())
        self.assertTrue(Doctor.objects.filter(is_active=False).exists())
        self.assertTrue(Patient.objects.exists())
        self.assertTrue(User.objects.filter(role=User.Role.ADMIN).exists())
        self.assertTrue(User.objects.filter(role=User.Role.EMPLOYEE).exists())

    def test_seed_includes_a_shared_doctor_date_session(self):
        """Proves the missing uniqueness constraint is exercised by the demo data."""
        self.seed()

        clash = (
            Appointment.objects.filter(status=Appointment.Status.CONFIRMED)
            .values("doctor_id", "appointment_date", "session")
            .order_by()
        )
        counts = {}
        for row in clash:
            key = (row["doctor_id"], row["appointment_date"], row["session"])
            counts[key] = counts.get(key, 0) + 1
        self.assertTrue(any(value > 1 for value in counts.values()))

    def test_every_cancelled_appointment_records_a_reason(self):
        self.seed()

        cancelled = Appointment.objects.filter(status=Appointment.Status.CANCELLED)
        self.assertTrue(cancelled.exists())
        self.assertFalse(cancelled.filter(cancellation_reason="").exists())

    def test_rerun_without_reset_is_refused(self):
        self.seed()

        with self.assertRaises(CommandError):
            self.seed()

    def test_reset_replaces_instead_of_duplicating(self):
        self.seed()
        before = Appointment.objects.count()

        self.seed("--reset")

        self.assertEqual(Appointment.objects.count(), before)
