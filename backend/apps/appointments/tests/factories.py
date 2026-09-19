import datetime

from django.utils import timezone

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.appointments.services import create_appointment
from apps.doctors.models import Doctor
from apps.specialties.models import Specialty


def tomorrow() -> datetime.date:
    return timezone.localdate() + datetime.timedelta(days=1)


def make_specialty(name: str = "Nội tổng hợp", *, is_active: bool = True) -> Specialty:
    return Specialty.objects.create(name=name, is_active=is_active)


def make_doctor(
    specialty: Specialty,
    *,
    full_name: str = "BS Tran Van B",
    is_active: bool = True,
) -> Doctor:
    return Doctor.objects.create(
        specialty=specialty,
        full_name=full_name,
        phone="0912345678",
        is_active=is_active,
    )


def make_employee(username: str = "nv01", role: str = User.Role.EMPLOYEE) -> User:
    return User.objects.create_user(
        username=username,
        password="matkhau-manh-123",
        full_name="Nhan Vien",
        role=role,
    )


def book(
    specialty: Specialty,
    *,
    doctor: Doctor | None = None,
    phone: str = "0901234567",
    full_name: str = "Nguyen Van A",
    appointment_date: datetime.date | None = None,
    session: str = Appointment.Session.MORNING,
    reason: str = "Kham tong quat",
) -> Appointment:
    return create_appointment(
        full_name=full_name,
        phone=phone,
        email="",
        specialty_id=specialty.pk,
        doctor_id=doctor.pk if doctor else None,
        appointment_date=appointment_date or tomorrow(),
        session=session,
        reason=reason,
    )
