"""Populate the database with demo data for manual testing.

Covers every appointment status, both sessions, active and inactive records,
and several bookings that share a doctor, date and session so the missing
uniqueness constraint is visible in the data itself.
"""

import datetime

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.appointments.services import create_appointment
from apps.doctors.models import Doctor, DoctorExpertise
from apps.patients.models import Patient
from apps.specialties.models import Specialty


User = get_user_model()

SPECIALTIES = [
    ("Nội tổng hợp", "Khám và điều trị các bệnh lý nội khoa thường gặp.", True),
    ("Tim mạch", "Tầm soát và điều trị bệnh lý tim mạch.", True),
    ("Nhi khoa", "Khám sức khỏe và điều trị cho trẻ em.", True),
    ("Da liễu", "Chuyên khoa đã tạm ngừng tiếp nhận.", False),
]

DOCTORS = [
    ("Trần Văn Bình", "Nội tổng hợp", "BS.CKII", "Trưởng khoa Nội Tổng hợp", 18, "0912000001", True),
    ("Nguyễn Thị Hoa", "Nội tổng hợp", "ThS.BS", "Bác sĩ điều trị", 9, "0912000002", True),
    ("Lê Minh Quân", "Tim mạch", "TS.BS", "Trưởng khoa Tim mạch", 22, "0912000003", True),
    ("Phạm Thu Hà", "Tim mạch", "BS.CKI", "Bác sĩ điều trị", 7, "0912000004", True),
    ("Đỗ Quang Huy", "Nhi khoa", "BS.CKI", "Bác sĩ điều trị", 11, "0912000005", True),
    ("Vũ Thanh Mai", "Nhi khoa", "ThS.BS", "Bác sĩ điều trị", 6, "0912000006", True),
    ("Hoàng Văn Nghỉ", "Nội tổng hợp", "BS", "Đã nghỉ công tác", 30, "0912000007", False),
]

EXPERTISE = {
    "Trần Văn Bình": ["Hồi sức nội khoa", "Bệnh lý nội tiết"],
    "Lê Minh Quân": ["Can thiệp mạch vành", "Suy tim mạn"],
    "Đỗ Quang Huy": ["Hô hấp nhi", "Tiêu hóa nhi"],
}

PATIENTS = [
    ("Nguyễn Văn An", "0901234567", "an.nguyen@example.com"),
    ("Trần Thị Bích", "0901234568", "bich.tran@example.com"),
    ("Lê Hoàng Cường", "0901234569", ""),
    ("Phạm Thị Dung", "0901234570", "dung.pham@example.com"),
    ("Đặng Minh Đức", "0901234571", ""),
]

ACCOUNTS = [
    ("admin", "Admin@12345", "Quản trị hệ thống", User.Role.ADMIN),
    ("nhanvien", "Employee@12345", "Nguyễn Thị Nhân Viên", User.Role.EMPLOYEE),
]


class Command(BaseCommand):
    help = "Create demo specialties, doctors, patients, users and appointments."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing appointments, patients, doctors and specialties first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()
        elif Appointment.objects.exists():
            raise CommandError(
                "Database already holds appointments. Re-run with --reset to replace them."
            )

        users = self._create_users()
        specialties = self._create_specialties()
        doctors = self._create_doctors(specialties)
        self._create_expertise(doctors)
        patients = self._create_patients()
        self._create_appointments(specialties, doctors, patients, users["nhanvien"])

        self.stdout.write(self.style.SUCCESS("Demo data created."))
        self._report()

    def _reset(self):
        Appointment.objects.all().delete()
        DoctorExpertise.objects.all().delete()
        Doctor.objects.all().delete()
        Specialty.objects.all().delete()
        Patient.objects.all().delete()
        self.stdout.write("Existing demo rows removed.")

    def _create_users(self) -> dict:
        users = {}
        for username, password, full_name, role in ACCOUNTS:
            user = User.objects.filter(username=username).first()
            if user is None:
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    full_name=full_name,
                    role=role,
                )
                if role == User.Role.ADMIN:
                    user.is_staff = True
                    user.is_superuser = True
                    user.save(update_fields=["is_staff", "is_superuser"])
            users[username] = user
        return users

    def _create_specialties(self) -> dict:
        return {
            name: Specialty.objects.create(
                name=name,
                description=description,
                is_active=is_active,
            )
            for name, description, is_active in SPECIALTIES
        }

    def _create_doctors(self, specialties: dict) -> dict:
        doctors = {}
        for full_name, specialty_name, credentials, position, years, phone, active in DOCTORS:
            doctors[full_name] = Doctor.objects.create(
                specialty=specialties[specialty_name],
                full_name=full_name,
                credentials=credentials,
                position=position,
                years_of_experience=years,
                phone=phone,
                is_active=active,
            )
        return doctors

    def _create_expertise(self, doctors: dict) -> None:
        for doctor_name, items in EXPERTISE.items():
            for order, expertise_name in enumerate(items):
                DoctorExpertise.objects.create(
                    doctor=doctors[doctor_name],
                    expertise_name=expertise_name,
                    display_order=order,
                )

    def _create_patients(self) -> dict:
        return {
            phone: Patient.objects.create(full_name=full_name, phone=phone, email=email)
            for full_name, phone, email in PATIENTS
        }

    def _create_appointments(self, specialties, doctors, patients, employee) -> None:
        today = timezone.localdate()
        now = timezone.now()
        noi = specialties["Nội tổng hợp"]
        tim = specialties["Tim mạch"]
        nhi = specialties["Nhi khoa"]
        binh = doctors["Trần Văn Bình"]
        quan = doctors["Lê Minh Quân"]
        huy = doctors["Đỗ Quang Huy"]

        # Future bookings go through the real service so validation is exercised.
        create_appointment(
            full_name="Nguyễn Văn An",
            phone="0901234567",
            specialty_id=noi.pk,
            doctor_id=binh.pk,
            appointment_date=today + datetime.timedelta(days=1),
            session=Appointment.Session.MORNING,
            reason="Khám tổng quát định kỳ",
        )
        # Same doctor, same date, same session as above: allowed on purpose.
        create_appointment(
            full_name="Trần Thị Bích",
            phone="0901234568",
            specialty_id=noi.pk,
            doctor_id=binh.pk,
            appointment_date=today + datetime.timedelta(days=1),
            session=Appointment.Session.MORNING,
            reason="Đau dạ dày kéo dài",
        )
        create_appointment(
            full_name="Lê Hoàng Cường",
            phone="0901234569",
            specialty_id=tim.pk,
            appointment_date=today + datetime.timedelta(days=2),
            session=Appointment.Session.AFTERNOON,
            reason="Hồi hộp, khó thở khi gắng sức",
        )
        create_appointment(
            full_name="Phạm Thị Dung",
            phone="0901234570",
            specialty_id=nhi.pk,
            appointment_date=today + datetime.timedelta(days=3),
            session=Appointment.Session.MORNING,
            reason="Bé sốt 3 ngày chưa hạ",
        )
        create_appointment(
            full_name="Đặng Minh Đức",
            phone="0901234571",
            specialty_id=tim.pk,
            doctor_id=quan.pk,
            appointment_date=today + datetime.timedelta(days=5),
            session=Appointment.Session.AFTERNOON,
            reason="Tái khám tăng huyết áp",
        )

        # Past and terminal states are written directly: the service rejects past dates.
        Appointment.objects.create(
            patient=patients["0901234567"],
            specialty=tim,
            doctor=quan,
            appointment_date=today - datetime.timedelta(days=2),
            session=Appointment.Session.MORNING,
            reason="Đau ngực trái",
            status=Appointment.Status.COMPLETED,
            started_at=now - datetime.timedelta(days=2, hours=3),
            completed_at=now - datetime.timedelta(days=2, hours=2),
        )
        Appointment.objects.create(
            patient=patients["0901234568"],
            specialty=nhi,
            doctor=huy,
            appointment_date=today - datetime.timedelta(days=1),
            session=Appointment.Session.AFTERNOON,
            reason="Ho kéo dài",
            status=Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.NO_SHOW,
            cancelled_by=employee,
            cancelled_at=now - datetime.timedelta(days=1),
        )
        Appointment.objects.create(
            patient=patients["0901234569"],
            specialty=noi,
            doctor=binh,
            appointment_date=today - datetime.timedelta(days=4),
            session=Appointment.Session.MORNING,
            reason="Khám sức khỏe xin việc",
            status=Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.PATIENT_REQUEST,
            cancelled_by=employee,
            cancelled_at=now - datetime.timedelta(days=5),
        )
        Appointment.objects.create(
            patient=patients["0901234570"],
            specialty=noi,
            appointment_date=today - datetime.timedelta(days=3),
            session=Appointment.Session.AFTERNOON,
            reason="Mệt mỏi kéo dài",
            status=Appointment.Status.CANCELLED,
            cancellation_reason=Appointment.CancellationReason.CLINIC,
            cancelled_by=employee,
            cancelled_at=now - datetime.timedelta(days=3),
        )
        Appointment.objects.create(
            patient=patients["0901234571"],
            specialty=nhi,
            doctor=huy,
            appointment_date=today,
            session=Appointment.Session.MORNING,
            reason="Bé nôn nhiều sau ăn",
            status=Appointment.Status.IN_PROGRESS,
            started_at=now - datetime.timedelta(minutes=20),
        )

    def _report(self) -> None:
        rows = [
            ("Người dùng nội bộ", User.objects.count()),
            ("Chuyên khoa", Specialty.objects.count()),
            ("Bác sĩ", Doctor.objects.count()),
            ("Lĩnh vực chuyên sâu", DoctorExpertise.objects.count()),
            ("Bệnh nhân", Patient.objects.count()),
            ("Lịch hẹn", Appointment.objects.count()),
        ]
        for label, count in rows:
            self.stdout.write(f"  {label}: {count}")

        self.stdout.write("\n  Lịch hẹn theo trạng thái:")
        for status in Appointment.Status.values:
            count = Appointment.objects.filter(status=status).count()
            self.stdout.write(f"    {status}: {count}")

        self.stdout.write("\n  Tài khoản đăng nhập:")
        for username, password, _, role in ACCOUNTS:
            self.stdout.write(f"    {username} / {password}  ({role})")

        codes = Appointment.objects.order_by("-id").values_list("booking_code", flat=True)[:3]
        self.stdout.write("\n  Mã tra cứu để thử màn hình Lookup:")
        for code in codes:
            self.stdout.write(f"    {code}")
