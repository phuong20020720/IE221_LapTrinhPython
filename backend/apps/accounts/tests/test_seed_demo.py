from datetime import timedelta
from io import StringIO

from django.core.management import call_command
from django.db.models import Count
from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor
from apps.patients.models import Patient
from apps.specialties.models import Specialty


class SeedDemoCommandTests(TestCase):
    def test_seed_creates_complete_idempotent_demo_dataset(self):
        output = StringIO()
        call_command("seed_demo", skip_images=True, stdout=output)
        call_command("seed_demo", skip_images=True, stdout=output)

        today = timezone.localdate()
        next_week_start = today + timedelta(days=7 - today.weekday())

        self.assertEqual(Specialty.objects.filter(is_active=True).count(), 10)
        self.assertEqual(Doctor.objects.filter(is_active=True).count(), 20)
        self.assertEqual(
            list(
                Specialty.objects.order_by("id")
                .annotate(doctor_count=Count("doctors"))
                .values_list("doctor_count", flat=True)
            ),
            [2] * 10,
        )
        self.assertEqual(Patient.objects.count(), 100)
        self.assertEqual(User.objects.filter(role=User.Role.EMPLOYEE).count(), 10)
        self.assertEqual(Appointment.objects.count(), 72)
        self.assertEqual(
            set(Appointment.objects.filter(appointment_date__lte=today).values_list("status", flat=True)),
            set(Appointment.Status.values),
        )
        self.assertEqual(
            Appointment.objects.filter(
                appointment_date__range=(next_week_start, next_week_start + timedelta(days=5)),
                status=Appointment.Status.CONFIRMED,
            ).count(),
            12,
        )
