from rest_framework import serializers

from apps.appointments.models import Appointment
from apps.patients.phone import normalize_phone


class AppointmentPatientSerializer(serializers.Serializer):
    """Biểu diễn bệnh nhân rút gọn chỉ dùng trong API nội bộ."""

    id = serializers.IntegerField()
    full_name = serializers.CharField()
    phone = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)


class AppointmentRelationSerializer(serializers.Serializer):
    """Biểu diễn id và tên của chuyên khoa hoặc bác sĩ."""

    id = serializers.IntegerField()
    name = serializers.CharField(source="full_name", required=False)

    def to_representation(self, instance):
        display_name = (
            getattr(instance, "display_name", None)
            or getattr(instance, "full_name", None)
            or getattr(instance, "name", "")
        )
        return {"id": instance.id, "name": display_name}


class AppointmentAdminSerializer(serializers.ModelSerializer):
    """Trả đầy đủ dữ liệu cần cho màn hình quản trị lịch hẹn."""

    patient = AppointmentPatientSerializer(read_only=True)
    specialty = AppointmentRelationSerializer(read_only=True)
    doctor = AppointmentRelationSerializer(read_only=True, allow_null=True)
    cancelled_by_name = serializers.CharField(
        source="cancelled_by.full_name", read_only=True, allow_null=True
    )
    session_label = serializers.CharField(source="get_session_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id", "booking_code", "patient", "specialty", "doctor",
            "appointment_date", "session", "session_label", "reason", "status",
            "status_label", "cancellation_reason", "cancelled_by_name",
            "cancelled_at", "started_at", "completed_at", "created_at", "updated_at",
        ]


class AppointmentPublicSerializer(serializers.ModelSerializer):
    """Giới hạn dữ liệu trả về sau khi khách đặt lịch thành công."""

    specialty = AppointmentRelationSerializer(read_only=True)
    doctor = AppointmentRelationSerializer(read_only=True, allow_null=True)
    session_label = serializers.CharField(source="get_session_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "booking_code", "specialty", "doctor", "appointment_date",
            "session", "session_label", "status", "status_label",
        ]


class AppointmentCreateSerializer(serializers.Serializer):
    """Kiểm tra payload đặt lịch công khai."""

    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    specialty_id = serializers.IntegerField(min_value=1)
    doctor_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    appointment_date = serializers.DateField()
    session = serializers.ChoiceField(choices=Appointment.Session.choices)
    reason = serializers.CharField(max_length=2000)

    def validate_phone(self, value: str) -> str:
        return normalize_phone(value)

    def validate_reason(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Lý do khám là bắt buộc.")
        return value.strip()


class AppointmentUpdateSerializer(serializers.Serializer):
    """Kiểm tra các trường Employee/Admin được phép cập nhật."""

    specialty_id = serializers.IntegerField(min_value=1, required=False)
    doctor_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    appointment_date = serializers.DateField(required=False)
    session = serializers.ChoiceField(choices=Appointment.Session.choices, required=False)
    reason = serializers.CharField(max_length=2000, required=False)
    status = serializers.ChoiceField(choices=Appointment.Status.choices, required=False)
    cancellation_reason = serializers.ChoiceField(
        choices=Appointment.CancellationReason.choices,
        required=False,
    )

    def validate_reason(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Lý do khám không được để trống.")
        return value.strip()


class AppointmentCancelSerializer(serializers.Serializer):
    """Kiểm tra lý do khi nhân viên hủy lịch."""

    cancellation_reason = serializers.ChoiceField(
        choices=Appointment.CancellationReason.choices,
        default=Appointment.CancellationReason.CLINIC,
    )
