import re

from rest_framework.exceptions import ValidationError


PHONE_PATTERN = re.compile(r"^0\d{9}$")


def normalize_phone(raw: str | None) -> str:
    """Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx (10 chữ số)."""
    if raw is None:
        raise ValidationError({"phone": "Số điện thoại là bắt buộc."})

    text = str(raw).strip()
    if not text:
        raise ValidationError({"phone": "Số điện thoại là bắt buộc."})

    digits = re.sub(r"\D", "", text)
    if digits.startswith("84") and len(digits) >= 11:
        digits = "0" + digits[2:]

    if not PHONE_PATTERN.fullmatch(digits):
        raise ValidationError(
            {"phone": "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0."}
        )
    return digits
