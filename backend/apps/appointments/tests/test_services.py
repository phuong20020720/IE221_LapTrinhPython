import datetime
from unittest.mock import patch

from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.appointments.models import Appointment
from apps.appointments.services import (
    MAX_DAYS_AHEAD,
    create_appointment,
    lookup_appointments,
    search_appointments,
    transition_appointment,
    update_appointment,
)
from apps.appointments.tests.factories import (
    book,
    make_doctor,
    make_employee,
    make_specialty,
    tomorrow,
)
from apps.patients.models import Patient


class BookingValidationTests(TestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)

    def test_booking_with_doctor_is_confirmed(self):
        appointment = book(self.specialty, doctor=self.doctor)
        self.assertEqual(appointment.status, Appointment.Status.CONFIRMED)
        self.assertEqual(appointment.doctor_id, self.doctor.pk)

    def test_booking_without_doctor_is_pending_assignment(self):
        appointment = book(self.specialty)
        self.assertEqual(appointment.status, Appointment.Status.PENDING_ASSIGNMENT)
        self.assertIsNone(appointment.doctor_id)

    def test_booking_code_is_unique_and_unguessable(self):
        first = book(self.specialty, phone="0901234567")
        second = book(self.specialty, phone="0901234568")
        self.assertNotEqual(first.booking_code, second.booking_code)
        self.assertEqual(len(str(first.booking_code)), 36)

    def test_doctor_must_belong_to_selected_specialty(self):
        other = make_specialty("Tim mạch")
        stranger = make_doctor(other, full_name="BS Le Van C")
        with self.assertRaises(ValidationError) as ctx:
            book(self.specialty, doctor=stranger)
        self.assertIn("doctor_id", ctx.exception.detail)

    def test_inactive_doctor_is_rejected(self):
        retired = make_doctor(self.specialty, full_name="BS Nghi", is_active=False)
        with self.assertRaises(ValidationError) as ctx:
            book(self.specialty, doctor=retired)
        self.assertIn("doctor_id", ctx.exception.detail)

    def test_inactive_specialty_is_rejected(self):
        closed = make_specialty("Da liễu", is_active=False)
        with self.assertRaises(ValidationError) as ctx:
            book(closed)
        self.assertIn("specialty_id", ctx.exception.detail)

    def test_unknown_specialty_is_rejected(self):
        with self.assertRaises(ValidationError):
            create_appointment(
                full_name="Nguyen Van A",
                phone="0901234567",
                specialty_id=999999,
                appointment_date=tomorrow(),
                session=Appointment.Session.MORNING,
                reason="Kham",
            )

    def test_past_date_is_rejected(self):
        yesterday = timezone.localdate() - datetime.timedelta(days=1)
        with self.assertRaises(ValidationError) as ctx:
            book(self.specialty, appointment_date=yesterday)
        self.assertIn("appointment_date", ctx.exception.detail)

    def test_today_is_accepted(self):
        appointment = book(self.specialty, appointment_date=timezone.localdate())
        self.assertEqual(appointment.appointment_date, timezone.localdate())

    def test_date_beyond_booking_window_is_rejected(self):
        far = timezone.localdate() + datetime.timedelta(days=MAX_DAYS_AHEAD + 1)
        with self.assertRaises(ValidationError) as ctx:
            book(self.specialty, appointment_date=far)
        self.assertIn("appointment_date", ctx.exception.detail)

    def test_invalid_session_is_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            book(self.specialty, session="EVENING")
        self.assertIn("session", ctx.exception.detail)

    def test_blank_reason_is_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            book(self.specialty, reason="   ")
        self.assertIn("reason", ctx.exception.detail)

    def test_invalid_phone_is_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            book(self.specialty, phone="12345")
        self.assertIn("phone", ctx.exception.detail)

    def test_multiple_appointments_allowed_in_same_doctor_date_session(self):
        first = book(self.specialty, doctor=self.doctor, phone="0901234567")
        second = book(self.specialty, doctor=self.doctor, phone="0901234568")
        self.assertNotEqual(first.pk, second.pk)
        self.assertEqual(first.appointment_date, second.appointment_date)
        self.assertEqual(first.session, second.session)


class BookingAtomicityTests(TestCase):
    def setUp(self):
        self.specialty = make_specialty()

    def test_existing_patient_is_reused_by_normalized_phone(self):
        book(self.specialty, phone="0901234567")
        book(self.specialty, phone="+84 901 234 567", full_name="Ten Khac")
        self.assertEqual(Patient.objects.count(), 1)
        self.assertEqual(Appointment.objects.count(), 2)
        self.assertEqual(Patient.objects.get().full_name, "Nguyen Van A")

    def test_patient_is_rolled_back_when_appointment_creation_fails(self):
        with patch(
            "apps.appointments.services.Appointment.objects.create",
            side_effect=RuntimeError("boom"),
        ):
            with self.assertRaises(RuntimeError):
                book(self.specialty, phone="0909999999")

        self.assertEqual(Patient.objects.filter(phone="0909999999").count(), 0)
        self.assertEqual(Appointment.objects.count(), 0)

    def test_no_patient_created_when_validation_fails_after_lookup(self):
        with self.assertRaises(ValidationError):
            book(self.specialty, reason="")
        self.assertEqual(Patient.objects.count(), 0)


class BookingAtomicityOnRealTransactionTests(TransactionTestCase):
    """Runs outside a test transaction to prove the rollback reaches the database."""

    def test_rollback_leaves_no_partial_rows(self):
        specialty = make_specialty()
        with patch(
            "apps.appointments.services.Appointment.objects.create",
            side_effect=RuntimeError("boom"),
        ):
            with self.assertRaises(RuntimeError):
                book(specialty, phone="0908888888")

        self.assertFalse(Patient.objects.filter(phone="0908888888").exists())
        self.assertFalse(Appointment.objects.exists())


class StateMachineTests(TestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)
        self.user = make_employee()

    def _to(self, appointment, target, **kwargs):
        return transition_appointment(
            appointment_id=appointment.pk,
            target_status=target,
            user=self.user,
            **kwargs,
        )

    def test_legal_path_confirmed_to_completed(self):
        appointment = book(self.specialty, doctor=self.doctor)
        appointment = self._to(appointment, Appointment.Status.IN_PROGRESS)
        self.assertIsNotNone(appointment.started_at)
        appointment = self._to(appointment, Appointment.Status.COMPLETED)
        self.assertEqual(appointment.status, Appointment.Status.COMPLETED)
        self.assertIsNotNone(appointment.completed_at)

    def test_confirmed_cannot_jump_to_completed(self):
        appointment = book(self.specialty, doctor=self.doctor)
        with self.assertRaises(ValidationError) as ctx:
            self._to(appointment, Appointment.Status.COMPLETED)
        self.assertIn("status", ctx.exception.detail)

    def test_completed_is_terminal(self):
        appointment = book(self.specialty, doctor=self.doctor)
        self._to(appointment, Appointment.Status.IN_PROGRESS)
        self._to(appointment, Appointment.Status.COMPLETED)
        with self.assertRaises(ValidationError):
            self._to(appointment, Appointment.Status.IN_PROGRESS)

    def test_cancelled_is_terminal(self):
        appointment = book(self.specialty, doctor=self.doctor)
        self._to(
            appointment,
            Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.PATIENT_REQUEST,
        )
        with self.assertRaises(ValidationError):
            self._to(appointment, Appointment.Status.CONFIRMED)

    def test_cannot_move_backwards(self):
        appointment = book(self.specialty, doctor=self.doctor)
        self._to(appointment, Appointment.Status.IN_PROGRESS)
        with self.assertRaises(ValidationError):
            self._to(appointment, Appointment.Status.CONFIRMED)

    def test_transition_to_same_status_is_rejected(self):
        appointment = book(self.specialty, doctor=self.doctor)
        with self.assertRaises(ValidationError):
            self._to(appointment, Appointment.Status.CONFIRMED)

    def test_pending_cannot_confirm_without_doctor(self):
        appointment = book(self.specialty)
        with self.assertRaises(ValidationError) as ctx:
            self._to(appointment, Appointment.Status.CONFIRMED)
        self.assertIn("doctor_id", ctx.exception.detail)

    def test_pending_confirms_after_assigning_matching_doctor(self):
        appointment = book(self.specialty)
        update_appointment(appointment_id=appointment.pk, doctor_id=self.doctor.pk)
        appointment = self._to(appointment, Appointment.Status.CONFIRMED)
        self.assertEqual(appointment.status, Appointment.Status.CONFIRMED)

    def test_pending_cannot_be_assigned_doctor_from_other_specialty(self):
        appointment = book(self.specialty)
        other = make_doctor(make_specialty("Tim mạch"), full_name="BS Khac")
        with self.assertRaises(ValidationError) as ctx:
            update_appointment(appointment_id=appointment.pk, doctor_id=other.pk)
        self.assertIn("doctor_id", ctx.exception.detail)

    def test_pending_can_be_cancelled(self):
        appointment = book(self.specialty)
        appointment = self._to(
            appointment,
            Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.CLINIC,
        )
        self.assertEqual(appointment.status, Appointment.Status.CANCELLED)

    def test_cancellation_requires_a_valid_reason(self):
        appointment = book(self.specialty, doctor=self.doctor)
        with self.assertRaises(ValidationError) as ctx:
            self._to(appointment, Appointment.Status.CANCELLED)
        self.assertIn("cancellation_reason", ctx.exception.detail)

    def test_cancellation_records_reason_actor_and_time(self):
        appointment = book(self.specialty, doctor=self.doctor)
        appointment = self._to(
            appointment,
            Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.NO_SHOW,
        )
        self.assertEqual(
            appointment.cancellation_reason,
            Appointment.CancellationReason.NO_SHOW,
        )
        self.assertEqual(appointment.cancelled_by_id, self.user.pk)
        self.assertIsNotNone(appointment.cancelled_at)

    def test_in_progress_can_be_cancelled(self):
        appointment = book(self.specialty, doctor=self.doctor)
        self._to(appointment, Appointment.Status.IN_PROGRESS)
        appointment = self._to(
            appointment,
            Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.CLINIC,
        )
        self.assertEqual(appointment.status, Appointment.Status.CANCELLED)

    def test_finished_appointment_cannot_be_updated(self):
        appointment = book(self.specialty, doctor=self.doctor)
        self._to(
            appointment,
            Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.CLINIC,
        )
        with self.assertRaises(ValidationError):
            update_appointment(appointment_id=appointment.pk, reason="Doi ly do")


class LookupTests(TestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)

    def test_lookup_by_booking_code(self):
        appointment = book(self.specialty, doctor=self.doctor)
        found = lookup_appointments(booking_code=str(appointment.booking_code))
        self.assertEqual([a.pk for a in found], [appointment.pk])

    def test_lookup_by_phone_returns_all_of_that_patient(self):
        book(self.specialty, phone="0901234567")
        book(self.specialty, phone="0901234567")
        book(self.specialty, phone="0901234568")
        found = lookup_appointments(phone="+84 901 234 567")
        self.assertEqual(len(found), 2)

    def test_lookup_requires_one_criterion(self):
        from rest_framework.exceptions import ValidationError as DRFValidationError

        with self.assertRaises(DRFValidationError):
            lookup_appointments()

    def test_lookup_with_unknown_code_raises_not_found(self):
        from rest_framework.exceptions import NotFound

        with self.assertRaises(NotFound):
            lookup_appointments(
                booking_code="11111111-1111-1111-1111-111111111111"
            )

    def test_lookup_with_malformed_code_does_not_leak_other_rows(self):
        from rest_framework.exceptions import NotFound

        book(self.specialty)
        with self.assertRaises(NotFound):
            lookup_appointments(booking_code="not-a-uuid")


class SearchTests(TestCase):
    def setUp(self):
        self.specialty = make_specialty()
        self.doctor = make_doctor(self.specialty)

    def test_filter_by_date_doctor_and_status(self):
        today = book(
            self.specialty,
            doctor=self.doctor,
            appointment_date=timezone.localdate(),
        )
        book(self.specialty, phone="0901234568", appointment_date=tomorrow())

        by_date = search_appointments(appointment_date=timezone.localdate())
        self.assertEqual([a.pk for a in by_date], [today.pk])

        by_doctor = search_appointments(doctor_id=self.doctor.pk)
        self.assertEqual([a.pk for a in by_doctor], [today.pk])

        by_status = search_appointments(status=Appointment.Status.PENDING_ASSIGNMENT)
        self.assertEqual(len(by_status), 1)

    def test_invalid_status_filter_is_rejected(self):
        with self.assertRaises(ValidationError):
            list(search_appointments(status="NOPE"))

    def test_free_text_matches_patient_name_and_phone(self):
        appointment = book(self.specialty, full_name="Tran Thi D", phone="0977777777")
        self.assertEqual(
            [a.pk for a in search_appointments(query="Tran Thi")],
            [appointment.pk],
        )
        self.assertEqual(
            [a.pk for a in search_appointments(query="0977777777")],
            [appointment.pk],
        )


class PaginateTests(TestCase):
    def setUp(self):
        self.specialty = make_specialty()
        for i in range(25):
            book(self.specialty, phone=f"09010000{i:02d}")

    def test_default_page_size_and_metadata(self):
        from apps.appointments.services import paginate

        page = paginate(search_appointments())
        self.assertEqual(len(page["results"]), 20)
        self.assertEqual(page["count"], 25)
        self.assertEqual(page["page"], 1)
        self.assertEqual(page["page_size"], 20)
        self.assertEqual(page["total_pages"], 2)

    def test_second_page_returns_remainder(self):
        from apps.appointments.services import paginate

        page = paginate(search_appointments(), page=2)
        self.assertEqual(len(page["results"]), 5)
        self.assertEqual(page["page"], 2)

    def test_out_of_range_page_is_clamped_to_last(self):
        from apps.appointments.services import paginate

        page = paginate(search_appointments(), page=99)
        self.assertEqual(page["page"], 2)

    def test_non_integer_page_falls_back_to_first(self):
        from apps.appointments.services import paginate

        page = paginate(search_appointments(), page="abc")
        self.assertEqual(page["page"], 1)

    def test_page_size_is_clamped_to_max(self):
        from apps.appointments.services import MAX_PAGE_SIZE, paginate

        page = paginate(search_appointments(), page_size=10_000)
        self.assertEqual(page["page_size"], MAX_PAGE_SIZE)

    def test_page_size_of_zero_falls_back_to_default(self):
        from apps.appointments.services import DEFAULT_PAGE_SIZE, paginate

        page = paginate(search_appointments(), page_size=0)
        self.assertEqual(page["page_size"], DEFAULT_PAGE_SIZE)
