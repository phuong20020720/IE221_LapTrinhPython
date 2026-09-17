# Chatbot policy và prompt-injection defense

## Sources

- Requirement: `inception/plainning/đặc-tả-mvp-và-quy-tắc-nghiệp-vụ.md#2.3-chatbot-ai`
- Architecture: `inception/architecture/security-and-permission-model.md#chatbot-safety`
- ADR: `inception/architecture/adr/003-chatbot-boundary.md`

## Acceptance criteria

- [x] Câu hỏi hợp lệ được phân loại `ALLOWED/ALLOW` và mới được gửi tới Gemini.
- [x] Dấu hiệu cấp cứu được phân loại `EMERGENCY/ESCALATE` mà không gọi Gemini.
- [x] Yêu cầu chẩn đoán, kê đơn và ngoài phạm vi được chuyển hướng an toàn.
- [x] Prompt injection và yêu cầu lấy bí mật/dữ liệu nội bộ bị chặn trước Gemini.
- [x] Số điện thoại/email gửi vào chat bị chặn và hướng sang biểu mẫu chính thức.
- [x] Gemini prompt coi knowledge là dữ liệu, không phải chỉ dẫn, và cấm tiết lộ prompt/secret.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | Slice không lưu policy hoặc hội thoại |
| Backend | `backend/apps/chatbot/safety.py`, `views.py`, `gemini.py` | Phân loại policy, chặn trước model và harden system instruction |
| Frontend | `frontend/src/shared/api/chatbot.ts` | Kiểu dữ liệu cho category/action và policy source |
| Tests | `backend/apps/chatbot/tests.py` | Allowed, emergency, diagnosis, injection, exfiltration, PII và out-of-scope |

## Evidence

| Command/check | Result |
|---|---|
| `.venv/Scripts/python manage.py check` | passed |
| `.venv/Scripts/python manage.py makemigrations --check --dry-run` | passed; no changes |
| `.venv/Scripts/python manage.py test` | passed (10 tests) |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test` | passed (1 test) |
| `npm run build` | passed |
| Live HTTP prompt-injection smoke test | passed (`PROMPT_INJECTION/BLOCK`) |
| Live HTTP secret-exfiltration smoke test | passed (`PRIVATE_DATA_REQUEST/BLOCK`) |

## Open items

- Pattern matching là lớp chặn nhanh, không bảo đảm phát hiện mọi biến thể tấn công; system instruction là lớp phòng vệ thứ hai.
- Rate limit và monitoring abuse vẫn cần trước production.

## Verification verdict

- `passed`: không có finding nghiêm trọng; security boundary, test, build và live smoke test đều đạt.
