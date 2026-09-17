import { FormEvent, PointerEvent, useEffect, useRef, useState } from "react";

import chatbotLogo from "../../assets/images/chatbot-logo-cropped.png";
import { sendChatbotMessage } from "../../shared/api/chatbot";

type ChatMessage = { role: "assistant" | "user"; text: string };
type WidgetPosition = { x: number; y: number } | null;

const WIDGET_SIZE = 72;
const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<WidgetPosition>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Xin chào! Mình có thể cung cấp thông tin về MediBook, bác sĩ, chuyên khoa và quy trình đặt lịch.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const messagesElement = messagesRef.current;
    if (messagesElement) messagesElement.scrollTop = messagesElement.scrollHeight;
  }, [isOpen, isSending, messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    setMessages((current) => [...current, { role: "user", text: message }]);
    setDraft("");
    setError("");
    setIsSending(true);
    try {
      const response = await sendChatbotMessage(message);
      setMessages((current) => [...current, { role: "assistant", text: response.answer }]);
    } catch {
      setError("Chatbot tạm thời chưa sẵn sàng. Bạn vui lòng thử lại sau.");
    } finally {
      setIsSending(false);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: rect.left, y: rect.top };
    didDrag.current = false;
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragStart.current) return;

    const deltaX = event.clientX - dragStart.current.pointerX;
    const deltaY = event.clientY - dragStart.current.pointerY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) didDrag.current = true;

    setPosition({
      x: clamp(dragStart.current.x + deltaX, VIEWPORT_MARGIN, window.innerWidth - WIDGET_SIZE - VIEWPORT_MARGIN),
      y: clamp(dragStart.current.y + deltaY, VIEWPORT_MARGIN, window.innerHeight - WIDGET_SIZE - VIEWPORT_MARGIN),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    dragStart.current = null;
  }

  function handleToggle() {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    setIsOpen((current) => !current);
  }

  return (
    <div
      className={`chatbot-widget${isOpen ? " chatbot-widget--open" : ""}`}
      style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}
    >
      {isOpen && (
        <section className="chatbot" aria-label="Trợ lý MediBook">
          <button
            className="chatbot__heading"
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng khung chat"
          >
            <div>
              <p className="eyebrow">MEDIBOOK AI</p>
              <h2>Trợ lý thông tin</h2>
            </div>
            <span className="chatbot__close" aria-hidden="true">
              ×
            </span>
          </button>
          <div className="chatbot__messages" aria-live="polite" ref={messagesRef}>
            {messages.map((item, index) => (
              <p className={`chatbot__message chatbot__message--${item.role}`} key={`${item.role}-${index}`}>
                {item.text}
              </p>
            ))}
            {isSending && <p className="chatbot__message chatbot__message--assistant">Đang tìm thông tin…</p>}
          </div>
          {error && <p className="chatbot__error" role="alert">{error}</p>}
          <p className="chatbot__disclaimer">Thông tin chỉ mang tính tham khảo, không thay thế bác sĩ.</p>
          <form className="chatbot__form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="chatbot-message">Câu hỏi</label>
            <input
              id="chatbot-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              placeholder="Ví dụ: Tôi cần chuẩn bị gì để đặt lịch?"
            />
            <button type="submit" disabled={isSending || !draft.trim()}>Gửi</button>
          </form>
        </section>
      )}
      {!isOpen && (
        <span className="chatbot__hint" id="chatbot-hint">
          Bạn cần hỗ trợ? Nhấn để chat
        </span>
      )}
      <button
        className="chatbot__launcher"
        type="button"
        aria-label={isOpen ? "Đóng trợ lý MediBook" : "Mở trợ lý MediBook"}
        aria-describedby={isOpen ? undefined : "chatbot-hint"}
        aria-expanded={isOpen}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleToggle}
      >
        <img src={chatbotLogo} alt="" />
      </button>
    </div>
  );
}
