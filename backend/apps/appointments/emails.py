from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from apps.appointments.models import Appointment


def send_appointment_confirmation(appointment_id: int, *, recipient: str) -> int:
    """Gửi email xác nhận bằng email backend được cấu hình cho từng môi trường."""
    appointment = Appointment.objects.select_related(
        "patient", "specialty", "doctor"
    ).get(pk=appointment_id)
    doctor_name = appointment.doctor.display_name if appointment.doctor else "Phòng khám sẽ phân công"
    session_name = appointment.get_session_display()
    subject = f"Medicare - Xác nhận lịch hẹn {appointment.booking_code}"
    text_message = (
        f"Xin chào {appointment.patient.full_name},\n\n"
        "Lịch khám của bạn đã được xác nhận.\n"
        f"Mã lịch: {appointment.booking_code}\n"
        f"Chuyên khoa: {appointment.specialty.name}\n"
        f"Bác sĩ: {doctor_name}\n"
        f"Ngày khám: {appointment.appointment_date:%d/%m/%Y}\n"
        f"Buổi khám: {session_name}\n"
        f"Trạng thái: {appointment.get_status_display()}\n\n"
        "Khi đến phòng khám, vui lòng có mặt trước 15 phút và đọc số điện thoại "
        f"{appointment.patient.phone} hoặc mã lịch hẹn cho nhân viên tiếp nhận.\n"
        "Nếu cần hỗ trợ, vui lòng gọi hotline 1900 6868."
    )
    html_message = render_to_string(
        "appointments/emails/appointment_confirmation.html",
        {
            "appointment": appointment,
            "doctor_name": doctor_name,
            "session_name": session_name,
        },
    )
    email = EmailMultiAlternatives(
        subject,
        text_message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient],
    )
    email.attach_alternative(html_message, "text/html")
    return email.send(fail_silently=False)
