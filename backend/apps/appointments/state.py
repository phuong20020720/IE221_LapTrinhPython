"""Appointment state machine, per `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#10`."""

from rest_framework.exceptions import ValidationError

from apps.appointments.models import Appointment


Status = Appointment.Status

ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    Status.PENDING_ASSIGNMENT: frozenset({Status.CONFIRMED, Status.CANCELLED}),
    Status.CONFIRMED: frozenset({Status.IN_PROGRESS, Status.CANCELLED}),
    Status.IN_PROGRESS: frozenset({Status.COMPLETED, Status.CANCELLED}),
    Status.COMPLETED: frozenset(),
    Status.CANCELLED: frozenset(),
}

TERMINAL_STATUSES = frozenset({Status.COMPLETED, Status.CANCELLED})


def can_transition(current: str, target: str) -> bool:
    return target in ALLOWED_TRANSITIONS.get(current, frozenset())


def assert_can_transition(current: str, target: str) -> None:
    if current == target:
        raise ValidationError(
            {"status": f"Lịch hẹn đã ở trạng thái {current}."}
        )
    if current in TERMINAL_STATUSES:
        raise ValidationError(
            {
                "status": (
                    f"Lịch hẹn đã kết thúc ở trạng thái {current}, "
                    "không thể chuyển sang trạng thái khác."
                )
            }
        )
    if not can_transition(current, target):
        raise ValidationError(
            {"status": f"Không thể chuyển trạng thái từ {current} sang {target}."}
        )
