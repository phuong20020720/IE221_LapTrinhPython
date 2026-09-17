import re
import unicodedata
from dataclasses import dataclass
from enum import Enum


class PolicyAction(str, Enum):
    ALLOW = "ALLOW"
    REDIRECT = "REDIRECT"
    ESCALATE = "ESCALATE"
    BLOCK = "BLOCK"


class PolicyCategory(str, Enum):
    ALLOWED = "ALLOWED"
    EMERGENCY = "EMERGENCY"
    MEDICAL_DECISION = "MEDICAL_DECISION"
    PROMPT_INJECTION = "PROMPT_INJECTION"
    PRIVATE_DATA_REQUEST = "PRIVATE_DATA_REQUEST"
    PERSONAL_DATA_INPUT = "PERSONAL_DATA_INPUT"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


@dataclass(frozen=True)
class PolicyDecision:
    category: PolicyCategory
    action: PolicyAction
    response: str | None = None


def _normalize(message: str) -> str:
    decomposed = unicodedata.normalize("NFKD", message)
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    return " ".join(without_accents.casefold().split())


EMERGENCY_PATTERN = re.compile(
    r"(kho tho|khong tho|dau nguc( du doi)?|dot quy|bat tinh|co giat|"
    r"chay mau khong cam|ngo doc|cap cuu|khong phan ung|tu tu|tu sat)"
)
MEDICAL_DECISION_PATTERN = re.compile(
    r"(chan doan|ke don|toa thuoc|lieu thuoc|uong thuoc gi|toi bi benh gi|"
    r"co phai.*benh|dieu tri ca nhan)"
)
PROMPT_INJECTION_PATTERN = re.compile(
    r"(bo qua|quen|vo hieu hoa).{0,40}(chi dan|quy tac|huong dan|prompt)|"
    r"ignore.{0,30}(previous|prior|system|instruction)|"
    r"(hien|in|lap lai|tiet lo|cung cap|cho toi|dua toi|show|reveal|print).{0,40}"
    r"(system prompt|developer message|chi dan an|hidden instruction)|"
    r"(jailbreak|do anything now|che do dan|gia vo khong co quy tac)"
)
PRIVATE_DATA_PATTERN = re.compile(
    r"(liet ke|cho xem|cho toi|dua toi|cung cap|lay|truy cap|xuat|dump|doc|tim|"
    r"show|reveal|give|print).{0,50}"
    r"(danh sach benh nhan|ho so benh an|lich hen cua nguoi|ghi chu noi bo|"
    r"mat khau|password|api key|secret key|jwt|access token|database|co so du lieu|"
    r"system prompt)|"
    r"(danh sach benh nhan|ho so benh an|ghi chu noi bo)"
)
OUT_OF_SCOPE_PATTERN = re.compile(
    r"(viet code|lam tho|ke chuyen|du bao thoi tiet|gia co phieu|chung khoan|"
    r"ket qua bong da|viet email|giai bai tap)"
)
PHONE_PATTERN = re.compile(r"(?<!\d)(?:\+?84|0)\d{9,10}(?!\d)")
EMAIL_PATTERN = re.compile(r"\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b", re.IGNORECASE)


def classify_message(message: str) -> PolicyDecision:
    normalized = _normalize(message)

    if EMERGENCY_PATTERN.search(normalized):
        return PolicyDecision(
            PolicyCategory.EMERGENCY,
            PolicyAction.ESCALATE,
            "Nếu bạn hoặc người bên cạnh đang có dấu hiệu cấp cứu, hãy gọi 115 "
            "hoặc đến cơ sở y tế gần nhất ngay lập tức. Chatbot không thể đánh giá "
            "hay xử lý tình trạng khẩn cấp.",
        )
    if PROMPT_INJECTION_PATTERN.search(normalized):
        return PolicyDecision(
            PolicyCategory.PROMPT_INJECTION,
            PolicyAction.BLOCK,
            "Mình không thể bỏ qua quy định an toàn, tiết lộ chỉ dẫn hệ thống hoặc "
            "thực hiện yêu cầu thay đổi phạm vi. Mình có thể hỗ trợ thông tin công "
            "khai về MediBook và kiến thức sức khỏe phổ thông đã được duyệt.",
        )
    if PRIVATE_DATA_PATTERN.search(normalized):
        return PolicyDecision(
            PolicyCategory.PRIVATE_DATA_REQUEST,
            PolicyAction.BLOCK,
            "Mình không thể truy cập hoặc tiết lộ dữ liệu bệnh nhân, lịch hẹn của "
            "người khác, thông tin nội bộ, thông tin xác thực hay bí mật hệ thống.",
        )
    if PHONE_PATTERN.search(normalized) or EMAIL_PATTERN.search(normalized):
        return PolicyDecision(
            PolicyCategory.PERSONAL_DATA_INPUT,
            PolicyAction.REDIRECT,
            "Bạn không nên gửi số điện thoại hoặc email trong khung chat này. "
            "Vui lòng truy cập trang Đặt lịch khám hoặc nhấn nút Đặt lịch khám trên "
            "trang chủ để nhập thông tin chính thức.",
        )
    if MEDICAL_DECISION_PATTERN.search(normalized):
        return PolicyDecision(
            PolicyCategory.MEDICAL_DECISION,
            PolicyAction.REDIRECT,
            "Mình không thể chẩn đoán, kê đơn hoặc hướng dẫn liều thuốc cá nhân hóa. "
            "Bạn nên đặt lịch và trao đổi trực tiếp với bác sĩ. Mình có thể cung cấp "
            "thông tin sức khỏe phổ thông đã được duyệt.",
        )
    if OUT_OF_SCOPE_PATTERN.search(normalized):
        return PolicyDecision(
            PolicyCategory.OUT_OF_SCOPE,
            PolicyAction.REDIRECT,
            "Yêu cầu này nằm ngoài phạm vi của trợ lý MediBook. Mình có thể hỗ trợ "
            "thông tin phòng khám, quy định đặt lịch và kiến thức sức khỏe phổ thông.",
        )
    return PolicyDecision(PolicyCategory.ALLOWED, PolicyAction.ALLOW)
