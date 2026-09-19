from rest_framework import serializers

from apps.appointments.models import Appointment


class AppointmentCreateSerializer(serializers.Serializer):
    """Public booking payload, per `inception/architecture/api-contract.md`."""

    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    specialty_id = serializers.IntegerField()
    doctor_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    appointment_date = serializers.DateField()
    session = serializers.ChoiceField(choices=Appointment.Session.choices)
    reason = serializers.CharField(max_length=2000)


class AppointmentLookupQuerySerializer(serializers.Serializer):
    booking_code = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, default="")


class AppointmentUpdateSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField(required=False, allow_null=True)
    appointment_date = serializers.DateField(required=False)
    session = serializers.ChoiceField(
        choices=Appointment.Session.choices,
        required=False,
    )
    reason = serializers.CharField(max_length=2000, required=False)

    def validate(self, attrs):
        if "doctor_id" in attrs and attrs["doctor_id"] is None:
            attrs.pop("doctor_id")
            attrs["clear_doctor"] = True
        return attrs


class AppointmentTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Appointment.Status.choices)
    cancellation_reason = serializers.ChoiceField(
        choices=Appointment.CancellationReason.choices,
        required=False,
        allow_blank=True,
        default="",
    )


class PublicAppointmentSerializer(serializers.ModelSerializer):
    """Public fields only, per MVP spec 11.5 — internal notes never leave here."""

    specialty_name = serializers.CharField(source="specialty.name", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    session_display = serializers.CharField(
        source="get_session_display",
        read_only=True,
    )

    class Meta:
        model = Appointment
        fields = [
            "booking_code",
            "specialty_name",
            "doctor_name",
            "appointment_date",
            "session",
            "session_display",
            "status",
            "status_display",
        ]

    def get_doctor_name(self, obj: Appointment) -> str | None:
        return obj.doctor.full_name if obj.doctor_id else None


class AppointmentOutputSerializer(serializers.ModelSerializer):
    """Full representation for the internal Employee/Admin screen."""

    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_phone = serializers.CharField(source="patient.phone", read_only=True)
    specialty_name = serializers.CharField(source="specialty.name", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    session_display = serializers.CharField(
        source="get_session_display",
        read_only=True,
    )
    cancelled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "booking_code",
            "patient",
            "patient_name",
            "patient_phone",
            "specialty",
            "specialty_name",
            "doctor",
            "doctor_name",
            "appointment_date",
            "session",
            "session_display",
            "reason",
            "status",
            "status_display",
            "cancellation_reason",
            "cancelled_by",
            "cancelled_by_name",
            "cancelled_at",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    def get_doctor_name(self, obj: Appointment) -> str | None:
        return obj.doctor.full_name if obj.doctor_id else None

    def get_cancelled_by_name(self, obj: Appointment) -> str | None:
        return obj.cancelled_by.full_name if obj.cancelled_by_id else None
