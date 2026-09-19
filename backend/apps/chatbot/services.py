from dataclasses import dataclass

from .gemini import generate_answer
from .knowledge import load_approved_knowledge
from .safety import PolicyAction, PolicyDecision, classify_message


MAX_HISTORY_MESSAGES = 6


@dataclass(frozen=True)
class ChatbotAnswer:
    answer: str
    source: str
    policy: PolicyDecision


def _safe_history(history: list[dict[str, str]]) -> list[dict[str, str]]:
    """Chỉ đưa các lượt hội thoại hợp lệ, có giới hạn vào context của model."""
    safe: list[dict[str, str]] = []
    allow_assistant_reply = False

    for item in history[-MAX_HISTORY_MESSAGES:]:
        role = item["role"]
        text = item["text"]

        if role == "user":
            allow_assistant_reply = classify_message(text).action == PolicyAction.ALLOW
            if allow_assistant_reply:
                safe.append({"role": role, "text": text})
            continue

        # Chỉ nhận câu trả lời assistant đi sau một user message đã qua safety.
        if allow_assistant_reply:
            safe.append({"role": role, "text": text})
        allow_assistant_reply = False

    return safe


def answer_chatbot_message(
    *,
    message: str,
    history: list[dict[str, str]] | None = None,
) -> ChatbotAnswer:
    """Điều phối safety, knowledge và Gemini cho một lượt chat công khai."""
    decision = classify_message(message)
    if decision.action != PolicyAction.ALLOW:
        return ChatbotAnswer(
            answer=decision.response or "",
            source="policy",
            policy=decision,
        )

    answer = generate_answer(
        message=message,
        knowledge=load_approved_knowledge(),
        history=_safe_history(history or []),
    )
    return ChatbotAnswer(answer=answer, source="gemini", policy=decision)
