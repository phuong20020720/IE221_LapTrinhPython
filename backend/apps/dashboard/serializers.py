from datetime import date

from rest_framework import serializers


class DashboardPeriodQuerySerializer(serializers.Serializer):
    week_date = serializers.DateField(required=False)
    month = serializers.RegexField(r"^\d{4}-(0[1-9]|1[0-2])$", required=False)

    def validate_month(self, value: str) -> date:
        return date.fromisoformat(f"{value}-01")

class DashboardMetricSerializer(serializers.Serializer):
    appointments_today = serializers.IntegerField(min_value=0)
    appointments_total = serializers.IntegerField(min_value=0)
    patients_total = serializers.IntegerField(min_value=0)
    doctors_total = serializers.IntegerField(min_value=0)


class AppointmentWeekdaySerializer(serializers.Serializer):
    date = serializers.DateField()
    label = serializers.CharField()
    count = serializers.IntegerField(min_value=0)


class PatientMonthSerializer(serializers.Serializer):
    month = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField(min_value=0)


class DashboardSummarySerializer(serializers.Serializer):
    generated_at = serializers.DateTimeField()
    summary = DashboardMetricSerializer()
    appointments_by_weekday = AppointmentWeekdaySerializer(many=True)
    patients_by_month = PatientMonthSerializer(many=True)
