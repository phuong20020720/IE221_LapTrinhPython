from datetime import datetime, time, timedelta
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor, DoctorExpertise
from apps.patients.models import Patient
from apps.specialties.models import Specialty


DEMO_PASSWORD = "Demo@123456"

SPECIALTIES = [
    ("Ngoại thần kinh - Cột sống", "Khám và điều trị bệnh lý não, thần kinh ngoại biên và cột sống."),
    ("Chấn thương chỉnh hình", "Điều trị chấn thương, bệnh lý xương khớp và phục hồi vận động."),
    ("Ngoại tổng hợp", "Khám, tư vấn và điều trị các bệnh lý ngoại khoa tổng quát."),
    ("Tai - Mũi - Họng", "Khám và điều trị bệnh lý tai, mũi, họng ở người lớn và trẻ em."),
    ("Nội tổng hợp", "Theo dõi và điều trị các bệnh lý nội khoa thường gặp."),
    ("Phục hồi chức năng", "Vật lý trị liệu và phục hồi chức năng sau chấn thương, phẫu thuật."),
    ("Sản Phụ khoa", "Chăm sóc sức khỏe sinh sản, thai kỳ và bệnh lý phụ khoa."),
    ("Mắt", "Khám thị lực và điều trị các bệnh lý về mắt."),
    ("Da liễu", "Khám và điều trị bệnh lý da, tóc, móng và chăm sóc da y khoa."),
    ("Nhi", "Khám, theo dõi tăng trưởng và điều trị bệnh lý trẻ em."),
]

DOCTORS = [
    ("Trần Minh Khôi", "TS.BS", "Trưởng khoa", 27, "Phẫu thuật cột sống", "Điều trị thoát vị đĩa đệm"),
    ("Nguyễn Thu Hà", "BS.CKII", "Bác sĩ chuyên khoa", 20, "Ngoại thần kinh", "Chấn thương sọ não"),
    ("Lê Quốc Bảo", "BS.CKII", "Trưởng khoa", 24, "Phẫu thuật khớp", "Chấn thương thể thao"),
    ("Phạm Ngọc Anh", "ThS.BS", "Bác sĩ chuyên khoa", 15, "Cơ - Xương - Khớp", "Phục hồi sau chấn thương"),
    ("Võ Đức Long", "TS.BS", "Trưởng khoa", 29, "Phẫu thuật tiêu hóa", "Ngoại lồng ngực"),
    ("Đặng Thùy Dung", "BS.CKII", "Bác sĩ chuyên khoa", 18, "Ngoại bụng", "Phẫu thuật ít xâm lấn"),
    ("Bùi Hoàng Nam", "BS.CKII", "Trưởng khoa", 22, "Phẫu thuật tai", "Nội soi mũi xoang"),
    ("Đỗ Thanh Mai", "ThS.BS", "Bác sĩ chuyên khoa", 14, "Thanh quản", "Tai mũi họng trẻ em"),
    ("Huỳnh Gia Huy", "TS.BS", "Trưởng khoa", 26, "Tim mạch nội khoa", "Rối loạn chuyển hóa"),
    ("Hồ Mỹ Linh", "BS.CKII", "Bác sĩ chuyên khoa", 17, "Nội tiết", "Nội tiêu hóa"),
    ("Dương Trọng Nghĩa", "ThS.BS", "Trưởng đơn vị", 19, "Phục hồi sau đột quỵ", "Vật lý trị liệu cơ xương khớp"),
    ("Ngô Khánh Vân", "BS.CKI", "Bác sĩ chuyên khoa", 11, "Phục hồi sau phẫu thuật", "Điều trị đau"),
    ("Lý Quỳnh Chi", "BS.CKII", "Trưởng khoa", 23, "Thai kỳ nguy cơ cao", "Phẫu thuật phụ khoa"),
    ("Trương Hải Yến", "ThS.BS", "Bác sĩ chuyên khoa", 13, "Chăm sóc tiền sản", "Nội tiết sinh sản"),
    ("Mai Thành Công", "BS.CKII", "Trưởng khoa", 25, "Phẫu thuật đục thủy tinh thể", "Bệnh lý võng mạc"),
    ("Tạ Bích Ngọc", "ThS.BS", "Bác sĩ chuyên khoa", 12, "Tật khúc xạ", "Nhãn nhi"),
    ("Phan Tuấn Kiệt", "BS.CKII", "Trưởng khoa", 21, "Da liễu lâm sàng", "Phẫu thuật da"),
    ("Cao Diễm My", "ThS.BS", "Bác sĩ chuyên khoa", 14, "Viêm da dị ứng", "Bệnh lý tóc và móng"),
    ("Vũ Nhật Minh", "BS.CKII", "Trưởng khoa", 24, "Hô hấp nhi", "Dinh dưỡng nhi khoa"),
    ("Đinh Phương Thảo", "ThS.BS", "Bác sĩ chuyên khoa", 12, "Sơ sinh", "Miễn dịch - Dị ứng nhi"),
]

EMPLOYEE_NAMES = [
    ("Nguyễn", "An"), ("Trần", "Bình"), ("Lê", "Châu"), ("Phạm", "Duy"),
    ("Võ", "Giang"), ("Đặng", "Hạnh"), ("Bùi", "Khang"), ("Đỗ", "Lan"),
    ("Huỳnh", "Minh"), ("Hồ", "Ngân"),
]

PATIENT_FAMILIES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"]
PATIENT_NAMES = [
    "Văn An", "Thị Bình", "Minh Châu", "Quang Duy", "Thu Giang",
    "Gia Hân", "Anh Khoa", "Ngọc Lan", "Hoàng Minh", "Kim Ngân",
]

REASONS = [
    "Khám đau đầu kéo dài", "Tái khám sau điều trị", "Đau khớp khi vận động",
    "Kiểm tra sức khỏe định kỳ", "Ho và khó thở", "Đau bụng và rối loạn tiêu hóa",
    "Khám da dị ứng", "Kiểm tra thị lực", "Tư vấn phục hồi vận động", "Khám tổng quát cho trẻ",
]


class Command(BaseCommand):
    help = "Tạo bộ dữ liệu hư cấu, ổn định và có thể chạy lại để demo MediBook."

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-images",
            action="store_true",
            help="Không chép ảnh bác sĩ vào media storage (dùng cho test nhanh).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.localdate()
        specialties = self._seed_specialties()
        employees = self._seed_employees()
        patients = self._seed_patients(today)
        doctors = self._seed_doctors(specialties, skip_images=options["skip_images"])
        appointments = self._seed_appointments(today, patients, doctors, employees[0])

        self.stdout.write(
            self.style.SUCCESS(
                "Đã seed: 10 chuyên khoa, 20 bác sĩ, 100 bệnh nhân, "
                f"10 nhân viên và {appointments} lịch hẹn."
            )
        )
        self.stdout.write(
            f"Tài khoản nhân viên: employee01 … employee10 | Mật khẩu: {DEMO_PASSWORD}"
        )

    def _seed_specialties(self):
        result = []
        for name, description in SPECIALTIES:
            specialty, _ = Specialty.objects.update_or_create(
                name_key=name.casefold(),
                defaults={"name": name, "description": description, "is_active": True},
            )
            result.append(specialty)
        return result

    def _seed_employees(self):
        result = []
        for index, (last_name, first_name) in enumerate(EMPLOYEE_NAMES, start=1):
            employee, _ = User.objects.update_or_create(
                username=f"employee{index:02d}",
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": f"{last_name} {first_name}",
                    "role": User.Role.EMPLOYEE,
                    "is_active": True,
                    "is_staff": False,
                },
            )
            employee.set_password(DEMO_PASSWORD)
            employee.save(update_fields=["password", "updated_at"])
            result.append(employee)
        return result

    def _seed_patients(self, today):
        result = []
        local_tz = timezone.get_current_timezone()
        for index in range(100):
            sequence = index + 1
            patient, _ = Patient.objects.update_or_create(
                phone=f"0917{sequence:06d}",
                defaults={
                    "full_name": f"{PATIENT_FAMILIES[index // 10]} {PATIENT_NAMES[index % 10]}",
                    "email": f"benhnhan{sequence:03d}@example.test",
                    "is_active": True,
                },
            )
            created_date = today - timedelta(days=(index * 5) % 175)
            created_at = timezone.make_aware(datetime.combine(created_date, time(8, 30)), local_tz)
            Patient.objects.filter(pk=patient.pk).update(created_at=created_at)
            patient.created_at = created_at
            result.append(patient)
        return result

    def _seed_doctors(self, specialties, *, skip_images):
        result = []
        for index, doctor_data in enumerate(DOCTORS, start=1):
            name, credentials, position, experience, expertise_one, expertise_two = doctor_data
            specialty = specialties[(index - 1) // 2]
            doctor, _ = Doctor.objects.update_or_create(
                phone=f"0908{index:06d}",
                defaults={
                    "specialty": specialty,
                    "full_name": name,
                    "credentials": credentials,
                    "position": position,
                    "years_of_experience": experience,
                    "email": f"bacsi{index:02d}@example.test",
                    "professional_description": (
                        f"Bác sĩ {name} có {experience} năm kinh nghiệm, chuyên sâu "
                        f"{expertise_one.lower()} và {expertise_two.lower()}."
                    ),
                    "is_active": True,
                },
            )
            expertise_names = [expertise_one, expertise_two]
            for order, expertise_name in enumerate(expertise_names):
                DoctorExpertise.objects.update_or_create(
                    doctor=doctor,
                    display_order=order,
                    defaults={"expertise_name": expertise_name, "description": ""},
                )
            doctor.expertises.exclude(display_order__in=range(len(expertise_names))).delete()
            if not skip_images:
                self._attach_image(doctor, index)
            result.append(doctor)
        return result

    def _attach_image(self, doctor, index):
        source = Path(settings.BASE_DIR) / "demo_assets" / "doctors" / f"doctor-{index:02d}.webp"
        if not source.exists():
            raise CommandError(f"Thiếu ảnh demo: {source}")
        storage_name = f"doctors/demo/doctor-{index:02d}.webp"
        if default_storage.exists(storage_name):
            default_storage.delete(storage_name)
        with source.open("rb") as stream:
            saved_name = default_storage.save(storage_name, File(stream))
        doctor.profile_image.name = saved_name
        doctor.save(update_fields=["profile_image", "updated_at"])

    def _seed_appointments(self, today, patients, doctors, cancelled_by):
        # Làm mới riêng lịch của 100 bệnh nhân demo để ngày luôn tương đối với lần chạy.
        Appointment.objects.filter(patient__in=patients).delete()
        local_tz = timezone.get_current_timezone()
        statuses = [
            Appointment.Status.CONFIRMED,
            Appointment.Status.IN_PROGRESS,
            Appointment.Status.COMPLETED,
            Appointment.Status.CANCELLED,
        ]
        records = []

        for day_offset in range(30):
            appointment_date = today - timedelta(days=day_offset)
            for slot in range(2):
                index = day_offset * 2 + slot
                status = statuses[index % len(statuses)]
                records.append(
                    self._appointment(
                        appointment_date=appointment_date,
                        patient=patients[index % len(patients)],
                        doctor=doctors[index % len(doctors)],
                        session=(Appointment.Session.MORNING if slot == 0 else Appointment.Session.AFTERNOON),
                        status=status,
                        reason=REASONS[index % len(REASONS)],
                        cancelled_by=cancelled_by,
                        local_tz=local_tz,
                    )
                )

        next_week_start = today + timedelta(days=(7 - today.weekday()))
        for day_offset in range(6):
            appointment_date = next_week_start + timedelta(days=day_offset)
            for slot in range(2):
                index = 60 + day_offset * 2 + slot
                records.append(
                    self._appointment(
                        appointment_date=appointment_date,
                        patient=patients[index % len(patients)],
                        doctor=doctors[index % len(doctors)],
                        session=(Appointment.Session.MORNING if slot == 0 else Appointment.Session.AFTERNOON),
                        status=Appointment.Status.CONFIRMED,
                        reason=REASONS[index % len(REASONS)],
                        cancelled_by=cancelled_by,
                        local_tz=local_tz,
                    )
                )

        Appointment.objects.bulk_create(records)
        return len(records)

    @staticmethod
    def _appointment(*, appointment_date, patient, doctor, session, status, reason, cancelled_by, local_tz):
        hour = 9 if session == Appointment.Session.MORNING else 14
        event_time = timezone.make_aware(datetime.combine(appointment_date, time(hour, 0)), local_tz)
        values = {
            "patient": patient,
            "specialty": doctor.specialty,
            "doctor": doctor,
            "appointment_date": appointment_date,
            "session": session,
            "reason": reason,
            "status": status,
        }
        if status == Appointment.Status.IN_PROGRESS:
            values["started_at"] = event_time
        elif status == Appointment.Status.COMPLETED:
            values["started_at"] = event_time
            values["completed_at"] = event_time + timedelta(minutes=35)
        elif status == Appointment.Status.CANCELLED:
            values["cancellation_reason"] = Appointment.CancellationReason.PATIENT_REQUEST
            values["cancelled_by"] = cancelled_by
            values["cancelled_at"] = event_time
        return Appointment(**values)
