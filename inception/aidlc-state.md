# AI-DLC State

- Profile: MVP
- Increment: Chatbot policy và prompt-injection defense
- Current stage: Acceptance
- Gate status: pending
- Last verified: 2026-09-17

## Scope

Phân loại câu hỏi chatbot thành cho phép, chuyển hướng, cấp cứu hoặc chặn; ngăn prompt injection, truy xuất dữ liệu/bí mật trái phép và dữ liệu cá nhân gửi nhầm trước khi gọi Gemini. Không triển khai Doctors hoặc Appointments API.

## Sources of truth

- `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#2.3-chatbot-ai`
- `inception/architecture/adr/003-chatbot-boundary.md`
- `inception/architecture/security-and-permission-model.md#chatbot-safety`

## Evidence

- Django check và migration check: passed.
- Backend suite: 10 tests passed.
- Frontend typecheck, ESLint, Vitest và production build: passed.
- Live prompt injection: `PROMPT_INJECTION/BLOCK`, Gemini không được gọi.
- Live secret exfiltration: `PRIVATE_DATA_REQUEST/BLOCK`, Gemini không được gọi.
- Verification Gate: passed; không có finding nghiêm trọng.
- Không có import Patient/Appointment trong chatbot; `.env` được ignore và không phát hiện Gemini secret trong source.

## Open decisions

- Rate limit và abuse monitoring chưa nằm trong slice này.

## Next action

Người dùng kiểm tra các nhóm policy trên UI và quyết định Acceptance Gate.
